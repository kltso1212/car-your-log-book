namespace dotnet.Models
{
    public class ParkingRecordDto
    {
        public long Id { get; set; } = 0;
        public DateOnly Date { get; set; }
        public string Carpark { get; set; } = string.Empty;
        public int RentalType { get; set; } = 1;
        public double Fee { get; set; } = 0;
    }
    public class ParkingRecord
    {
        public long Id { get; set; } = 0;
        public DateOnly Date { get; set; }
        public string Carpark { get; set; } = string.Empty;
        public int RentalType { get; set; } = 1;
        public double Fee { get; set; } = 0;
        public int VehicleId { get; set; } = 0;
        public Vehicle Vehicle { get; set; } = null!;
        public ParkingRecord() { }
        public ParkingRecord(ParkingRecordDto data)
        {
            this.Date = data.Date;
            this.Carpark = data.Carpark;
            this.RentalType = data.RentalType;
            this.Fee = data.Fee;
        }
        public ParkingRecordDto Data => new ParkingRecordDto()
        {
            Id = this.Id,
            Date = this.Date,
            Carpark = this.Carpark,
            RentalType = this.RentalType,
            Fee = this.Fee
        };
    }
}
