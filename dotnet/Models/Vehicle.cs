namespace dotnet.Models
{
    public class VehicleDto
    {
        public string Id { get; set; } = string.Empty;
        // 1 petrol / 2 hybrid / 3 electric / 4 diesel. Set at creation only.
        public int Type { get; set; } = 1;
    }
    public class Vehicle
    {
        public string Id { get; set; } = string.Empty;
        public int Type { get; set; } = 1;
        public ICollection<FuelRecord> FuelRecords { get; set; } = [];
        public ICollection<ChargeRecord> ChargeRecords { get; set; } = [];
        public Vehicle() { }
        public Vehicle(VehicleDto data)
        {
            this.Id = data.Id;
            this.Type = (data.Type >= 1 && data.Type <= 4) ? data.Type : 1;
        }
        public VehicleDto Data => new VehicleDto() { Id = this.Id, Type = this.Type };
    }
}
