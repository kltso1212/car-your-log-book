using Microsoft.EntityFrameworkCore;

namespace dotnet.Models
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }
        public virtual DbSet<Vehicle> Vehicles { get; set; }
        public virtual DbSet<FuelRecord> FuelRecords { get; set; }
        public virtual DbSet<ChargeRecord> ChargeRecords { get; set; }
        public virtual DbSet<TunnelRecord> TunnelRecords { get; set; }
        public virtual DbSet<ParkingRecord> ParkingRecords { get; set; }
        public virtual DbSet<FineRecord> FineRecords { get; set; }
        public virtual DbSet<ServiceRecord> ServiceRecords { get; set; }
        public virtual DbSet<InsuranceRecord> InsuranceRecords { get; set; }
        public virtual DbSet<LicenceRecord> LicenceRecords { get; set; }
        public virtual DbSet<Image> Images { get; set; }
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Vehicle>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.Property(e => e.Id).HasColumnType("INTEGER").HasColumnName("id")
                    .ValueGeneratedOnAdd();
                entity.Property(e => e.Plate).HasColumnType("TEXT").HasColumnName("plate");
                entity.Property(e => e.Type).HasColumnType("INTEGER").HasColumnName("type");
                entity.Property(e => e.Brand).HasColumnType("TEXT").HasColumnName("brand");
                entity.Property(e => e.Model).HasColumnType("TEXT").HasColumnName("model");
                entity.Property(e => e.Year).HasColumnType("INTEGER").HasColumnName("year");

                entity.ToTable("vehicles");
            });

            modelBuilder.Entity<FuelRecord>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.Property(e => e.Id).HasColumnType("INTEGER").HasColumnName("id")
                    .ValueGeneratedOnAdd();
                entity.Property(e => e.Date).HasColumnType("TEXT").HasColumnName("date");
                entity.Property(e => e.Odm).HasColumnType("INTEGER").HasColumnName("odm");
                entity.Property(e => e.Vendor).HasColumnType("INTEGER").HasColumnName("vendor");
                entity.Property(e => e.FuelType).HasColumnType("INTEGER").HasColumnName("fuel_type");
                entity.Property(e => e.Litre).HasColumnType("REAL").HasColumnName("litre");
                entity.Property(e => e.Price).HasColumnType("REAL").HasColumnName("price");
                entity.Property(e => e.VehicleId).HasColumnType("INTEGER").HasColumnName("vehicle_id");

                entity.HasOne(e => e.Vehicle)
                    .WithMany(v => v.FuelRecords)
                    .HasForeignKey(e => e.VehicleId)
                    .OnDelete(DeleteBehavior.Cascade);

                // odm is unique per vehicle only, not the table PK.
                entity.HasIndex(e => new { e.VehicleId, e.Odm }).IsUnique();

                entity.ToTable("fuel_records");
            });

            modelBuilder.Entity<ChargeRecord>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.Property(e => e.Id).HasColumnType("INTEGER").HasColumnName("id")
                    .ValueGeneratedOnAdd();
                entity.Property(e => e.Date).HasColumnType("TEXT").HasColumnName("date");
                entity.Property(e => e.Odm).HasColumnType("INTEGER").HasColumnName("odm");
                entity.Property(e => e.Kwh).HasColumnType("REAL").HasColumnName("kwh");
                entity.Property(e => e.Price).HasColumnType("REAL").HasColumnName("price");
                entity.Property(e => e.VehicleId).HasColumnType("INTEGER").HasColumnName("vehicle_id");

                entity.HasOne(e => e.Vehicle)
                    .WithMany(v => v.ChargeRecords)
                    .HasForeignKey(e => e.VehicleId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasIndex(e => new { e.VehicleId, e.Odm }).IsUnique();

                entity.ToTable("charge_records");
            });

            modelBuilder.Entity<TunnelRecord>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.Property(e => e.Id).HasColumnType("INTEGER").HasColumnName("id")
                    .ValueGeneratedOnAdd();
                entity.Property(e => e.Date).HasColumnType("TEXT").HasColumnName("date");
                entity.Property(e => e.Tunnel).HasColumnType("INTEGER").HasColumnName("tunnel");
                entity.Property(e => e.Bound).HasColumnType("INTEGER").HasColumnName("bound");
                entity.Property(e => e.Fee).HasColumnType("REAL").HasColumnName("fee");
                entity.Property(e => e.VehicleId).HasColumnType("INTEGER").HasColumnName("vehicle_id");

                entity.HasOne(e => e.Vehicle)
                    .WithMany(v => v.TunnelRecords)
                    .HasForeignKey(e => e.VehicleId)
                    .OnDelete(DeleteBehavior.Cascade);

                // No UNIQUE constraint: same tunnel twice a day is normal.
                entity.HasIndex(e => new { e.VehicleId, e.Date });

                entity.ToTable("tunnel_records");
            });

            modelBuilder.Entity<ParkingRecord>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.Property(e => e.Id).HasColumnType("INTEGER").HasColumnName("id")
                    .ValueGeneratedOnAdd();
                entity.Property(e => e.Date).HasColumnType("TEXT").HasColumnName("date");
                entity.Property(e => e.Carpark).HasColumnType("TEXT").HasColumnName("carpark");
                entity.Property(e => e.RentalType).HasColumnType("INTEGER").HasColumnName("rental_type");
                entity.Property(e => e.Fee).HasColumnType("REAL").HasColumnName("fee");
                entity.Property(e => e.VehicleId).HasColumnType("INTEGER").HasColumnName("vehicle_id");

                entity.HasOne(e => e.Vehicle)
                    .WithMany(v => v.ParkingRecords)
                    .HasForeignKey(e => e.VehicleId)
                    .OnDelete(DeleteBehavior.Cascade);

                // No UNIQUE constraint: multiple parks per day are normal.
                entity.HasIndex(e => new { e.VehicleId, e.Date });

                entity.ToTable("parking_records");
            });

            modelBuilder.Entity<FineRecord>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.Property(e => e.Id).HasColumnType("INTEGER").HasColumnName("id")
                    .ValueGeneratedOnAdd();
                entity.Property(e => e.Date).HasColumnType("TEXT").HasColumnName("date");
                entity.Property(e => e.Offences).HasColumnType("TEXT").HasColumnName("offences");
                entity.Property(e => e.CustomOffence).HasColumnType("TEXT").HasColumnName("custom_offence");
                entity.Property(e => e.Location).HasColumnType("TEXT").HasColumnName("location");
                entity.Property(e => e.Penalty).HasColumnType("REAL").HasColumnName("penalty");
                entity.Property(e => e.VehicleId).HasColumnType("INTEGER").HasColumnName("vehicle_id");

                entity.HasOne(e => e.Vehicle)
                    .WithMany(v => v.FineRecords)
                    .HasForeignKey(e => e.VehicleId)
                    .OnDelete(DeleteBehavior.Cascade);

                // No UNIQUE constraint: bad days happen.
                entity.HasIndex(e => new { e.VehicleId, e.Date });

                entity.ToTable("fine_records");
            });

            modelBuilder.Entity<ServiceRecord>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.Property(e => e.Id).HasColumnType("INTEGER").HasColumnName("id")
                    .ValueGeneratedOnAdd();
                entity.Property(e => e.Date).HasColumnType("TEXT").HasColumnName("date");
                entity.Property(e => e.Odm).HasColumnType("INTEGER").HasColumnName("odm");
                entity.Property(e => e.Items).HasColumnType("TEXT").HasColumnName("items");
                entity.Property(e => e.CustomItem).HasColumnType("TEXT").HasColumnName("custom_item");
                entity.Property(e => e.Price).HasColumnType("REAL").HasColumnName("price");
                entity.Property(e => e.VehicleId).HasColumnType("INTEGER").HasColumnName("vehicle_id");

                entity.HasOne(e => e.Vehicle)
                    .WithMany(v => v.ServiceRecords)
                    .HasForeignKey(e => e.VehicleId)
                    .OnDelete(DeleteBehavior.Cascade);

                // UNIQUE(vehicle_id, odm) like fuel — one service per mileage point.
                entity.HasIndex(e => new { e.VehicleId, e.Odm }).IsUnique();

                entity.ToTable("service_records");
            });

            modelBuilder.Entity<InsuranceRecord>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.Property(e => e.Id).HasColumnType("INTEGER").HasColumnName("id")
                    .ValueGeneratedOnAdd();
                entity.Property(e => e.Date).HasColumnType("TEXT").HasColumnName("date");
                entity.Property(e => e.Type).HasColumnType("INTEGER").HasColumnName("type");
                entity.Property(e => e.Broker).HasColumnType("TEXT").HasColumnName("broker");
                entity.Property(e => e.Fee).HasColumnType("REAL").HasColumnName("fee");
                entity.Property(e => e.VehicleId).HasColumnType("INTEGER").HasColumnName("vehicle_id");

                entity.HasOne(e => e.Vehicle)
                    .WithMany(v => v.InsuranceRecords)
                    .HasForeignKey(e => e.VehicleId)
                    .OnDelete(DeleteBehavior.Cascade);

                // One policy per start date.
                entity.HasIndex(e => new { e.VehicleId, e.Date }).IsUnique();

                entity.ToTable("insurance_records");
            });

            modelBuilder.Entity<LicenceRecord>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.Property(e => e.Id).HasColumnType("INTEGER").HasColumnName("id")
                    .ValueGeneratedOnAdd();
                entity.Property(e => e.Date).HasColumnType("TEXT").HasColumnName("date");
                entity.Property(e => e.Type).HasColumnType("INTEGER").HasColumnName("type");
                entity.Property(e => e.Fee).HasColumnType("REAL").HasColumnName("fee");
                entity.Property(e => e.VehicleId).HasColumnType("INTEGER").HasColumnName("vehicle_id");

                entity.HasOne(e => e.Vehicle)
                    .WithMany(v => v.LicenceRecords)
                    .HasForeignKey(e => e.VehicleId)
                    .OnDelete(DeleteBehavior.Cascade);

                // One licence per start date.
                entity.HasIndex(e => new { e.VehicleId, e.Date }).IsUnique();

                entity.ToTable("licence_records");
            });

            modelBuilder.Entity<Image>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.Property(e => e.Id).HasColumnType("INTEGER").HasColumnName("id")
                    .ValueGeneratedOnAdd();
                entity.Property(e => e.EntityType).HasColumnType("TEXT").HasColumnName("entity_type");
                entity.Property(e => e.EntityId).HasColumnType("INTEGER").HasColumnName("entity_id");
                entity.Property(e => e.Kind).HasColumnType("TEXT").HasColumnName("kind");
                entity.Property(e => e.FileName).HasColumnType("TEXT").HasColumnName("file_name");
                entity.Property(e => e.Mime).HasColumnType("TEXT").HasColumnName("mime");
                entity.Property(e => e.Width).HasColumnType("INTEGER").HasColumnName("width");
                entity.Property(e => e.Height).HasColumnType("INTEGER").HasColumnName("height");
                entity.Property(e => e.SizeBytes).HasColumnType("INTEGER").HasColumnName("size_bytes");
                entity.Property(e => e.CreatedAt).HasColumnType("TEXT").HasColumnName("created_at");

                // No FK: images outlive cascading record deletes via explicit cleanup.
                entity.HasIndex(e => new { e.EntityType, e.EntityId, e.Kind }).IsUnique();

                entity.ToTable("images");
            });

            base.OnModelCreating(modelBuilder);
        }
    }
}
