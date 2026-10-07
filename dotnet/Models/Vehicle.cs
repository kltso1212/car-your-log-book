namespace dotnet.Models
{
    public class VehicleDto
    {
        public int Id { get; set; } = 0;
        public string Plate { get; set; } = string.Empty;
        // 1 petrol / 2 hybrid / 3 electric / 4 diesel. Changeable via PUT.
        public int Type { get; set; } = 1;
        public string Brand { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
        public int? Year { get; set; }
    }
    public class Vehicle
    {
        public int Id { get; set; } = 0;
        public string Plate { get; set; } = string.Empty;
        public int Type { get; set; } = 1;
        public string Brand { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
        public int? Year { get; set; }
        public ICollection<FuelRecord> FuelRecords { get; set; } = [];
        public ICollection<ChargeRecord> ChargeRecords { get; set; } = [];
        public ICollection<TunnelRecord> TunnelRecords { get; set; } = [];
        public ICollection<ParkingRecord> ParkingRecords { get; set; } = [];
        public ICollection<FineRecord> FineRecords { get; set; } = [];
        public ICollection<ServiceRecord> ServiceRecords { get; set; } = [];
        public ICollection<InsuranceRecord> InsuranceRecords { get; set; } = [];
        public ICollection<LicenceRecord> LicenceRecords { get; set; } = [];
        public Vehicle() { }
        public Vehicle(VehicleDto data)
        {
            this.Plate = (data.Plate ?? string.Empty).Trim().ToUpper();
            this.Type = (data.Type >= 1 && data.Type <= 4) ? data.Type : 1;
            this.Brand = (data.Brand ?? string.Empty).Trim();
            this.Model = (data.Model ?? string.Empty).Trim();
            this.Year = data.Year;
        }
        public VehicleDto Data => new VehicleDto() { Id = this.Id, Plate = this.Plate, Type = this.Type, Brand = this.Brand, Model = this.Model, Year = this.Year };
    }
}
