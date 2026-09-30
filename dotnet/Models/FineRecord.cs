using System.Text.Json;

namespace dotnet.Models
{
    public class FineRecordDto
    {
        public long Id { get; set; } = 0;
        public DateOnly Date { get; set; }
        public List<int> Offences { get; set; } = [];
        public string? CustomOffence { get; set; }
        public string? Location { get; set; }
        public double Penalty { get; set; } = 0;
    }
    public class FineRecord
    {
        public long Id { get; set; } = 0;
        public DateOnly Date { get; set; }
        // JSON int[] in TEXT (see docs/lookup-ids.md 3xx domain).
        public string Offences { get; set; } = "[]";
        public string? CustomOffence { get; set; }
        public string? Location { get; set; }
        public double Penalty { get; set; } = 0;
        public string VehicleId { get; set; } = string.Empty;
        public Vehicle Vehicle { get; set; } = null!;
        public FineRecord() { }
        public FineRecord(FineRecordDto data)
        {
            this.Date = data.Date;
            this.Offences = JsonSerializer.Serialize(data.Offences ?? []);
            this.CustomOffence = data.CustomOffence;
            this.Location = data.Location;
            this.Penalty = data.Penalty;
        }
        public FineRecordDto Data => new FineRecordDto()
        {
            Id = this.Id,
            Date = this.Date,
            Offences = JsonSerializer.Deserialize<List<int>>(this.Offences ?? "[]") ?? [],
            CustomOffence = this.CustomOffence,
            Location = this.Location,
            Penalty = this.Penalty
        };
    }
}
