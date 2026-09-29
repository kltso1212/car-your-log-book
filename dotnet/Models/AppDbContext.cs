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
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Vehicle>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.Property(e => e.Id).HasColumnType("TEXT").HasColumnName("id");
                entity.Property(e => e.Type).HasColumnType("INTEGER").HasColumnName("type");

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
                entity.Property(e => e.VehicleId).HasColumnType("TEXT").HasColumnName("vehicle_id");

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
                entity.Property(e => e.VehicleId).HasColumnType("TEXT").HasColumnName("vehicle_id");

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
                entity.Property(e => e.VehicleId).HasColumnType("TEXT").HasColumnName("vehicle_id");

                entity.HasOne(e => e.Vehicle)
                    .WithMany(v => v.TunnelRecords)
                    .HasForeignKey(e => e.VehicleId)
                    .OnDelete(DeleteBehavior.Cascade);

                // No UNIQUE constraint: same tunnel twice a day is normal.
                entity.HasIndex(e => new { e.VehicleId, e.Date });

                entity.ToTable("tunnel_records");
            });

            base.OnModelCreating(modelBuilder);
        }
    }
}
