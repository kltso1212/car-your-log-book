namespace dotnet.Models
{
    public class FuelRecordDto
    {
        public long Id { get; set; } = 0;
        public DateOnly Date { get; set; }
        public int Odm { get; set; } = 0;
        public int Vendor { get; set; } = 0;
        public int FuelType { get; set; } = 0;
        public double Litre { get; set; } = 0;
        public double Price { get; set; } = 0;
        public double PricePerLitre => (Litre > 0) ? (Price / Litre) : 0;
    }
    public class FuelRecord
    {
        public long Id { get; set; } = 0;
        public DateOnly Date { get; set; }
        public int Odm { get; set; } = 0;
        public int Vendor { get; set; } = 0;
        public int FuelType { get; set; } = 0;
        public double Litre { get; set; } = 0;
        public double Price { get; set; } = 0;
        public int VehicleId { get; set; } = 0;
        public Vehicle Vehicle { get; set; } = null!;
        public FuelRecord() { }
        public FuelRecord(FuelRecordDto data)
        {
            this.Date = data.Date;
            this.Odm = data.Odm;
            this.Vendor = data.Vendor;
            this.FuelType = data.FuelType;
            this.Litre = data.Litre;
            this.Price = data.Price;
        }
        public FuelRecordDto Data => new FuelRecordDto()
        {
            Id = this.Id,
            Date = this.Date,
            Odm = this.Odm,
            Vendor = this.Vendor,
            FuelType = this.FuelType,
            Litre = this.Litre,
            Price = this.Price
        };
    }
}
