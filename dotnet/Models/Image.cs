namespace dotnet.Models
{
    public class Image
    {
        public long Id { get; set; } = 0;
        public string EntityType { get; set; } = string.Empty;
        public int EntityId { get; set; } = 0;
        public string Kind { get; set; } = string.Empty;
        public string FileName { get; set; } = string.Empty;
        public string Mime { get; set; } = string.Empty;
        public int? Width { get; set; }
        public int? Height { get; set; }
        public long SizeBytes { get; set; } = 0;
        public string CreatedAt { get; set; } = string.Empty;
    }
}
