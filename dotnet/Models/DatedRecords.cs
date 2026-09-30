namespace dotnet.Models
{
    public class InsuranceRecordDto
    {
        public long Id { get; set; } = 0;
        public DateOnly Date { get; set; }
        public int Type { get; set; } = 2;
        public string? Broker { get; set; }
        public double Fee { get; set; } = 0;
    }
    public class InsuranceRecord
    {
        public long Id { get; set; } = 0;
        public DateOnly Date { get; set; }
        public int Type { get; set; } = 2;
        public string? Broker { get; set; }
        public double Fee { get; set; } = 0;
        public string VehicleId { get; set; } = string.Empty;
        public Vehicle Vehicle { get; set; } = null!;
        public InsuranceRecord() { }
        public InsuranceRecord(InsuranceRecordDto data)
        {
            this.Date = data.Date;
            this.Type = data.Type;
            this.Broker = data.Broker;
            this.Fee = data.Fee;
        }
        public InsuranceRecordDto Data => new InsuranceRecordDto()
        {
            Id = this.Id,
            Date = this.Date,
            Type = this.Type,
            Broker = this.Broker,
            Fee = this.Fee
        };
    }
    public class LicenceRecordDto
    {
        public long Id { get; set; } = 0;
        public DateOnly Date { get; set; }
        public int Type { get; set; } = 2;
        public double Fee { get; set; } = 0;
    }
    public class LicenceRecord
    {
        public long Id { get; set; } = 0;
        public DateOnly Date { get; set; }
        public int Type { get; set; } = 2;
        public double Fee { get; set; } = 0;
        public string VehicleId { get; set; } = string.Empty;
        public Vehicle Vehicle { get; set; } = null!;
        public LicenceRecord() { }
        public LicenceRecord(LicenceRecordDto data)
        {
            this.Date = data.Date;
            this.Type = data.Type;
            this.Fee = data.Fee;
        }
        public LicenceRecordDto Data => new LicenceRecordDto()
        {
            Id = this.Id,
            Date = this.Date,
            Type = this.Type,
            Fee = this.Fee
        };
    }
}
