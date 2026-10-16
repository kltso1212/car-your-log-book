using dotnet.Models;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace dotnet.Services
{
    // Images: files on disk under UploadDir (default: next to sqlite.db),
    // db rows in `images` keyed by (entity_type, entity_id, kind) — 1 avatar per
    // vehicle, 1 receipt per record. `source` (optional upload field) keeps the
    // uncropped avatar so it can be re-cropped later (stored as <kind>_source).
    public static class ImageStorage
    {
        public static readonly IReadOnlyDictionary<string, string> EntityTables = new Dictionary<string, string>
        {
            ["vehicle"] = "vehicles",
            ["fuel_record"] = "fuel_records",
            ["charge_record"] = "charge_records",
            ["tunnel_record"] = "tunnel_records",
            ["parking_record"] = "parking_records",
            ["fine_record"] = "fine_records",
            ["service_record"] = "service_records",
            ["insurance_record"] = "insurance_records",
            ["licence_record"] = "licence_records",
        };
        public static readonly IReadOnlySet<string> Kinds = new HashSet<string> { "avatar", "receipt" }; // '<kind>_source' rows are stored implicitly
        public static readonly IReadOnlyDictionary<string, string> AllowedMime = new Dictionary<string, string>
        {
            ["image/jpeg"] = "jpg",
            ["image/png"] = "png",
            ["image/webp"] = "webp",
        };
        public const long MaxImageBytes = 10 * 1024 * 1024;

        // Filesystem location shared with the SQLite file so both live on one
        // volume: /data/sqlite.db + /data/uploads in compose, ../sqlite.db +
        // ../uploads locally. UPLOAD_DIR overrides (same env var in every backend).
        public static string UploadDir { get; private set; } = string.Empty;

        public static void Init(IConfiguration configuration)
        {
            var uploadDir = configuration["UPLOAD_DIR"];
            if (!string.IsNullOrWhiteSpace(uploadDir))
            {
                UploadDir = Path.GetFullPath(uploadDir);
            }
            else
            {
                var connectionString = configuration.GetConnectionString("DefaultConnection")
                    ?? "Data Source=../sqlite.db";
                var dataSource = new SqliteConnectionStringBuilder(connectionString).DataSource;
                if (string.IsNullOrWhiteSpace(dataSource)) dataSource = "../sqlite.db";
                var dbDir = Path.GetDirectoryName(Path.GetFullPath(dataSource)) ?? ".";
                UploadDir = Path.Combine(dbDir, "uploads");
            }
            Directory.CreateDirectory(UploadDir);
        }

        public static async Task<bool> EntityExistsAsync(AppDbContext db, string entityType, int entityId)
        {
            return entityType switch
            {
                "vehicle" => await db.Vehicles.AnyAsync(v => v.Id == entityId),
                "fuel_record" => await db.FuelRecords.AnyAsync(r => r.Id == entityId),
                "charge_record" => await db.ChargeRecords.AnyAsync(r => r.Id == entityId),
                "tunnel_record" => await db.TunnelRecords.AnyAsync(r => r.Id == entityId),
                "parking_record" => await db.ParkingRecords.AnyAsync(r => r.Id == entityId),
                "fine_record" => await db.FineRecords.AnyAsync(r => r.Id == entityId),
                "service_record" => await db.ServiceRecords.AnyAsync(r => r.Id == entityId),
                "insurance_record" => await db.InsuranceRecords.AnyAsync(r => r.Id == entityId),
                "licence_record" => await db.LicenceRecords.AnyAsync(r => r.Id == entityId),
                _ => false,
            };
        }

        public static string FilePathOf(string entityType, int entityId, string fileName) =>
            Path.Combine(UploadDir, entityType, entityId.ToString(), fileName);

        // Writes the buffer under uploads/<entityType>/<entityId>/<uuid>.<ext>.
        public static string SaveImageFile(byte[] buffer, string entityType, int entityId, string mime)
        {
            var fileName = $"{Guid.NewGuid()}.{AllowedMime[mime]}";
            var target = FilePathOf(entityType, entityId, fileName);
            Directory.CreateDirectory(Path.GetDirectoryName(target)!);
            File.WriteAllBytes(target, buffer);
            return fileName;
        }

        public static void RemoveImageFile(string entityType, int entityId, string? fileName)
        {
            if (string.IsNullOrEmpty(fileName)) return;
            var path = FilePathOf(entityType, entityId, fileName);
            if (File.Exists(path)) File.Delete(path);
        }

        public static object ImageJson(Image row) => new
        {
            id = row.Id,
            entityType = row.EntityType,
            entityId = row.EntityId,
            kind = row.Kind,
            mime = row.Mime,
            width = row.Width,
            height = row.Height,
            sizeBytes = row.SizeBytes,
            url = $"/api/images/{row.Id}/file",
            createdAt = row.CreatedAt,
        };

        // Removes db rows + files for one entity (all kinds: avatar, avatar_source, receipt).
        public static int DeleteFor(AppDbContext db, string entityType, int entityId)
        {
            var rows = db.Images
                .Where(i => i.EntityType == entityType && i.EntityId == entityId)
                .ToList();
            foreach (var row in rows) RemoveImageFile(row.EntityType, row.EntityId, row.FileName);
            db.Images.RemoveRange(rows);
            db.SaveChanges();
            return rows.Count;
        }

        // Deleting a vehicle cascades its records away, so their images would be
        // orphaned — collect record ids first, then drop every related image.
        public static void DeleteVehicleImages(AppDbContext db, int vehicleId)
        {
            DeleteFor(db, "vehicle", vehicleId);
            DeleteForRecordIds(db, "fuel_record", db.FuelRecords.Where(r => r.VehicleId == vehicleId).Select(r => r.Id).ToList());
            DeleteForRecordIds(db, "charge_record", db.ChargeRecords.Where(r => r.VehicleId == vehicleId).Select(r => r.Id).ToList());
            DeleteForRecordIds(db, "tunnel_record", db.TunnelRecords.Where(r => r.VehicleId == vehicleId).Select(r => r.Id).ToList());
            DeleteForRecordIds(db, "parking_record", db.ParkingRecords.Where(r => r.VehicleId == vehicleId).Select(r => r.Id).ToList());
            DeleteForRecordIds(db, "fine_record", db.FineRecords.Where(r => r.VehicleId == vehicleId).Select(r => r.Id).ToList());
            DeleteForRecordIds(db, "service_record", db.ServiceRecords.Where(r => r.VehicleId == vehicleId).Select(r => r.Id).ToList());
            DeleteForRecordIds(db, "insurance_record", db.InsuranceRecords.Where(r => r.VehicleId == vehicleId).Select(r => r.Id).ToList());
            DeleteForRecordIds(db, "licence_record", db.LicenceRecords.Where(r => r.VehicleId == vehicleId).Select(r => r.Id).ToList());
        }

        private static void DeleteForRecordIds(AppDbContext db, string entityType, List<long> ids)
        {
            foreach (var id in ids) DeleteFor(db, entityType, (int)id);
        }
    }
}
