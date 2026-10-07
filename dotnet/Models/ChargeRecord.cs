namespace dotnet.Models
{
    public class ChargeRecordDto
    {
        public long Id { get; set; } = 0;
        public DateOnly Date { get; set; }
        public int Odm { get; set; } = 0;
        public double Kwh { get; set; } = 0;
        public double Price { get; set; } = 0;
        public double PricePerKwh => (Kwh > 0) ? (Price / Kwh) : 0;
    }
    public class ChargeRecord
    {
        public long Id { get; set; } = 0;
        public DateOnly Date { get; set; }
        public int Odm { get; set; } = 0;
        public double Kwh { get; set; } = 0;
        public double Price { get; set; } = 0;
        public int VehicleId { get; set; } = 0;
        public Vehicle Vehicle { get; set; } = null!;
        public ChargeRecord() { }
        public ChargeRecord(ChargeRecordDto data)
        {
            this.Date = data.Date;
            this.Odm = data.Odm;
            this.Kwh = data.Kwh;
            this.Price = data.Price;
        }
        public ChargeRecordDto Data => new ChargeRecordDto()
        {
            Id = this.Id,
            Date = this.Date,
            Odm = this.Odm,
            Kwh = this.Kwh,
            Price = this.Price
        };
    }
}
