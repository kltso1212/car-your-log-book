namespace dotnet.Models
{
    public class TunnelRecordDto
    {
        public long Id { get; set; } = 0;
        public DateOnly Date { get; set; }
        public int Tunnel { get; set; } = 0;
        public int Bound { get; set; } = 0;
        public double Fee { get; set; } = 0;
    }
    public class TunnelRecord
    {
        public long Id { get; set; } = 0;
        public DateOnly Date { get; set; }
        public int Tunnel { get; set; } = 0;
        public int Bound { get; set; } = 0;
        public double Fee { get; set; } = 0;
        public string VehicleId { get; set; } = string.Empty;
        public Vehicle Vehicle { get; set; } = null!;
        public TunnelRecord() { }
        public TunnelRecord(TunnelRecordDto data)
        {
            this.Date = data.Date;
            this.Tunnel = data.Tunnel;
            this.Bound = data.Bound;
            this.Fee = data.Fee;
        }
        public TunnelRecordDto Data => new TunnelRecordDto()
        {
            Id = this.Id,
            Date = this.Date,
            Tunnel = this.Tunnel,
            Bound = this.Bound,
            Fee = this.Fee
        };
    }
}
