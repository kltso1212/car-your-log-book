using dotnet.Models;
using dotnet.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<IVehicleService, VehicleService>();
builder.Services.AddScoped<IFuelRecordService, FuelRecordService>();
builder.Services.AddScoped<IChargeRecordService, ChargeRecordService>();
builder.Services.AddScoped<ITunnelRecordService, TunnelRecordService>();
builder.Services.AddScoped<IParkingRecordService, ParkingRecordService>();
builder.Services.AddScoped<IFineRecordService, FineRecordService>();
builder.Services.AddScoped<IServiceRecordService, ServiceRecordService>();
builder.Services.AddScoped<IInsuranceRecordService, InsuranceRecordService>();
builder.Services.AddScoped<ILicenceRecordService, LicenceRecordService>();

// Image files live next to the SQLite file so both share one volume:
// /data/sqlite.db + /data/uploads in compose, ../sqlite.db + ../uploads locally.
// UPLOAD_DIR overrides the location (same env var in every backend).
ImageStorage.Init(builder.Configuration);

var app = builder.Build();

// SQLite code-first without migrations: create the file + tables on start.
// Assumes the new schema (vehicles with INTEGER PK + plate/brand/model/year).
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();
    var conn = db.Database.GetDbConnection();
    if (conn.State != System.Data.ConnectionState.Open) conn.Open();
    using var cmd = conn.CreateCommand();
    // EnsureCreated() skips existing files, so create newer tables explicitly.
    cmd.CommandText =
        "CREATE TABLE IF NOT EXISTS charge_records (" +
        "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
        "date TEXT NOT NULL, " +
        "odm INTEGER NOT NULL, " +
        "kwh REAL NOT NULL, " +
        "price REAL NOT NULL, " +
        "vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE)";
    cmd.ExecuteNonQuery();
    cmd.CommandText =
        "CREATE UNIQUE INDEX IF NOT EXISTS IX_charge_records_vehicle_id_odm " +
        "ON charge_records (vehicle_id, odm)";
    cmd.ExecuteNonQuery();
    cmd.CommandText =
        "CREATE TABLE IF NOT EXISTS tunnel_records (" +
        "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
        "date TEXT NOT NULL, " +
        "tunnel INTEGER NOT NULL, " +
        "bound INTEGER NOT NULL, " +
        "fee REAL NOT NULL, " +
        "vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE)";
    cmd.ExecuteNonQuery();
    cmd.CommandText =
        "CREATE INDEX IF NOT EXISTS IX_tunnel_records_vehicle_id_date " +
        "ON tunnel_records (vehicle_id, date)";
    cmd.ExecuteNonQuery();
    cmd.CommandText =
        "CREATE TABLE IF NOT EXISTS parking_records (" +
        "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
        "date TEXT NOT NULL, " +
        "carpark TEXT NOT NULL, " +
        "rental_type INTEGER NOT NULL, " +
        "fee REAL NOT NULL, " +
        "vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE)";
    cmd.ExecuteNonQuery();
    cmd.CommandText =
        "CREATE INDEX IF NOT EXISTS IX_parking_records_vehicle_id_date " +
        "ON parking_records (vehicle_id, date)";
    cmd.ExecuteNonQuery();
    cmd.CommandText =
        "CREATE TABLE IF NOT EXISTS fine_records (" +
        "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
        "date TEXT NOT NULL, " +
        "offences TEXT NOT NULL DEFAULT '[]', " +
        "custom_offence TEXT, " +
        "location TEXT, " +
        "penalty REAL NOT NULL, " +
        "vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE)";
    cmd.ExecuteNonQuery();
    cmd.CommandText =
        "CREATE INDEX IF NOT EXISTS IX_fine_records_vehicle_id_date " +
        "ON fine_records (vehicle_id, date)";
    cmd.ExecuteNonQuery();
    cmd.CommandText =
        "CREATE TABLE IF NOT EXISTS service_records (" +
        "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
        "date TEXT NOT NULL, " +
        "odm INTEGER NOT NULL, " +
        "items TEXT NOT NULL DEFAULT '[]', " +
        "custom_item TEXT, " +
        "price REAL NOT NULL, " +
        "vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE)";
    cmd.ExecuteNonQuery();
    cmd.CommandText =
        "CREATE UNIQUE INDEX IF NOT EXISTS IX_service_records_vehicle_id_odm " +
        "ON service_records (vehicle_id, odm)";
    cmd.ExecuteNonQuery();
    cmd.CommandText =
        "CREATE TABLE IF NOT EXISTS insurance_records (" +
        "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
        "date TEXT NOT NULL, " +
        "type INTEGER NOT NULL, " +
        "broker TEXT, " +
        "fee REAL NOT NULL, " +
        "vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE)";
    cmd.ExecuteNonQuery();
    cmd.CommandText =
        "CREATE UNIQUE INDEX IF NOT EXISTS IX_insurance_records_vehicle_id_date " +
        "ON insurance_records (vehicle_id, date)";
    cmd.ExecuteNonQuery();
    cmd.CommandText =
        "CREATE TABLE IF NOT EXISTS licence_records (" +
        "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
        "date TEXT NOT NULL, " +
        "type INTEGER NOT NULL, " +
        "fee REAL NOT NULL, " +
        "vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE)";
    cmd.ExecuteNonQuery();
    cmd.CommandText =
        "CREATE UNIQUE INDEX IF NOT EXISTS IX_licence_records_vehicle_id_date " +
        "ON licence_records (vehicle_id, date)";
    cmd.ExecuteNonQuery();
    cmd.CommandText =
        "CREATE TABLE IF NOT EXISTS images (" +
        "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
        "entity_type TEXT NOT NULL, " +
        "entity_id INTEGER NOT NULL, " +
        "kind TEXT NOT NULL, " +
        "file_name TEXT NOT NULL, " +
        "mime TEXT NOT NULL, " +
        "width INTEGER, " +
        "height INTEGER, " +
        "size_bytes INTEGER NOT NULL, " +
        "created_at TEXT NOT NULL, " +
        "UNIQUE (entity_type, entity_id, kind))";
    cmd.ExecuteNonQuery();
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

var corsOrigin = (builder.Configuration["CORS_ORIGIN"] ?? "*").Trim();
if (corsOrigin is "" or "*")
{
    // Dev/LAN default: any PC or phone on the network works with no IP edits.
    // Production/cloud: set CORS_ORIGIN=https://<frontend-url>
    app.UseCors(p => p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
}
else
{
    var origins = corsOrigin.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
    app.UseCors(p => p.WithOrigins(origins).AllowAnyHeader().AllowAnyMethod());
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
