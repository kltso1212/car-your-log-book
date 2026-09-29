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

var app = builder.Build();

// SQLite code-first without migrations: create the file + tables on start,
// then bring pre-existing files up to date (type column + backfill petrol).
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();
    var conn = db.Database.GetDbConnection();
    if (conn.State != System.Data.ConnectionState.Open) conn.Open();
    using var cmd = conn.CreateCommand();
    cmd.CommandText = "SELECT COUNT(*) FROM pragma_table_info('vehicles') WHERE name='type'";
    var hasType = cmd.ExecuteScalar() as long? ?? 0L;
    if (hasType == 0)
    {
        cmd.CommandText = "ALTER TABLE vehicles ADD COLUMN type INTEGER NOT NULL DEFAULT 1";
        cmd.ExecuteNonQuery();
    }
    cmd.CommandText = "UPDATE vehicles SET type=1 WHERE CAST(type AS INTEGER) NOT IN (1,2,3,4)";
    cmd.ExecuteNonQuery();
    // EnsureCreated() skips existing files, so create newer tables explicitly.
    cmd.CommandText =
        "CREATE TABLE IF NOT EXISTS charge_records (" +
        "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
        "date TEXT NOT NULL, " +
        "odm INTEGER NOT NULL, " +
        "kwh REAL NOT NULL, " +
        "price REAL NOT NULL, " +
        "vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE)";
    cmd.ExecuteNonQuery();
    cmd.CommandText =
        "CREATE UNIQUE INDEX IF NOT EXISTS IX_charge_records_vehicle_id_odm " +
        "ON charge_records (vehicle_id, odm)";
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
