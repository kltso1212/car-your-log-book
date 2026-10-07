using System.Text.Json;

namespace dotnet.Models
{
    public class ServiceRecordDto
    {
        public long Id { get; set; } = 0;
        public DateOnly Date { get; set; }
        public int Odm { get; set; } = 0;
        public List<int> Items { get; set; } = [];
        public string? CustomItem { get; set; }
        public double Price { get; set; } = 0;
    }
    public class ServiceRecord
    {
        public long Id { get; set; } = 0;
        public DateOnly Date { get; set; }
        public int Odm { get; set; } = 0;
        // JSON int[] in TEXT (see docs/lookup-ids.md 2xx domain).
        public string Items { get; set; } = "[]";
        public string? CustomItem { get; set; }
        public double Price { get; set; } = 0;
        public int VehicleId { get; set; } = 0;
        public Vehicle Vehicle { get; set; } = null!;
        public ServiceRecord() { }
        public ServiceRecord(ServiceRecordDto data)
        {
            this.Date = data.Date;
            this.Odm = data.Odm;
            this.Items = JsonSerializer.Serialize(data.Items ?? []);
            this.CustomItem = data.CustomItem;
            this.Price = data.Price;
        }
        public ServiceRecordDto Data => new ServiceRecordDto()
        {
            Id = this.Id,
            Date = this.Date,
            Odm = this.Odm,
            Items = JsonSerializer.Deserialize<List<int>>(this.Items ?? "[]") ?? [],
            CustomItem = this.CustomItem,
            Price = this.Price
        };
    }
}
