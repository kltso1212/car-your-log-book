using dotnet.Models;
using dotnet.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace dotnet.Controllers
{
    // Images: files on disk under UPLOAD_DIR (default: next to sqlite.db),
    // db rows in `images` keyed by (entity_type, entity_id, kind) — 1 avatar per
    // vehicle, 1 receipt per record. `source` (optional upload field) keeps the
    // uncropped avatar so it can be re-cropped later (stored as <kind>_source).
    [Route("api/images")]
    [ApiController]
    public class ImagesController : Controller
    {
        private readonly AppDbContext _context;
        public ImagesController(AppDbContext context) { _context = context; }

        [HttpPost]
        public async Task<IActionResult> Post([FromQuery] string? entityType, [FromQuery] string? entityId, [FromQuery] string? kind)
        {
            if (string.IsNullOrEmpty(entityType) || !ImageStorage.EntityTables.ContainsKey(entityType))
                return BadRequest(new { message = "圖片類型無效" });
            if (!int.TryParse(entityId, out var eid) || eid <= 0)
                return BadRequest(new { message = "圖片對象無效" });
            if (string.IsNullOrEmpty(kind) || !ImageStorage.Kinds.Contains(kind))
                return BadRequest(new { message = "圖片用途無效" });
            if (!await ImageStorage.EntityExistsAsync(_context, entityType, eid))
                return NotFound(new { message = entityType == "vehicle" ? "找不到車輛" : "找不到記錄" });

            if (!Request.HasFormContentType)
                return BadRequest(new { message = "缺少圖片" });
            IFormCollection form;
            try
            {
                form = await Request.ReadFormAsync();
            }
            catch (InvalidDataException)
            {
                return BadRequest(new { message = "圖片太大 (最大 10MB)" });
            }
            var main = form.Files.FirstOrDefault(f => f.Name == "file");
            var source = form.Files.FirstOrDefault(f => f.Name == "source");
            if ((main is not null && main.Length > ImageStorage.MaxImageBytes) ||
                (source is not null && source.Length > ImageStorage.MaxImageBytes))
                return BadRequest(new { message = "圖片太大 (最大 10MB)" });
            if (main is null)
                return BadRequest(new { message = "缺少圖片" });
            if (!ImageStorage.AllowedMime.ContainsKey(main.ContentType) ||
                (source is not null && !ImageStorage.AllowedMime.ContainsKey(source.ContentType)))
                return BadRequest(new { message = "圖片格式無效" });

            try
            {
                ReplaceKind(entityType, eid, kind);
                var image = await InsertImageAsync(form, main, entityType, eid, kind, "width", "height");
                Image? sourceImage = null;
                if (source is not null)
                {
                    // Replace '<kind>_source' only when a source file is present,
                    // otherwise keep it.
                    ReplaceKind(entityType, eid, $"{kind}_source");
                    sourceImage = await InsertImageAsync(form, source, entityType, eid, $"{kind}_source", "sourceWidth", "sourceHeight");
                }
                return StatusCode(StatusCodes.Status201Created, new
                {
                    message = "圖片已上載",
                    image = ImageStorage.ImageJson(image),
                    source = sourceImage is null ? null : ImageStorage.ImageJson(sourceImage),
                });
            }
            catch (IOException)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new { message = "圖片上載失敗" });
            }
        }

        [HttpGet]
        public async Task<IActionResult> Get([FromQuery] string? entityType, [FromQuery] string? entityId)
        {
            if (string.IsNullOrEmpty(entityType) || !ImageStorage.EntityTables.ContainsKey(entityType))
                return BadRequest(new { message = "圖片類型無效" });
            var ids = (entityId ?? string.Empty).Split(',')
                .Select(s => int.TryParse(s.Trim(), out var n) && n > 0 ? n : 0)
                .Where(n => n > 0)
                .ToList();
            if (ids.Count == 0)
                return BadRequest(new { message = "圖片對象無效" });
            var images = await _context.Images
                .Where(i => i.EntityType == entityType && ids.Contains(i.EntityId))
                .OrderBy(i => i.Id)
                .ToListAsync();
            return Ok(images.Select(ImageStorage.ImageJson).ToList());
        }

        [HttpGet("{id}/file")]
        public async Task<IActionResult> GetFile(string id)
        {
            if (!long.TryParse(id, out var imageId))
                return NotFound(new { message = "找不到圖片" });
            var image = await _context.Images.FirstOrDefaultAsync(i => i.Id == imageId);
            if (image is null)
                return NotFound(new { message = "找不到圖片" });
            var path = ImageStorage.FilePathOf(image.EntityType, image.EntityId, image.FileName);
            if (!System.IO.File.Exists(path))
                return NotFound(new { message = "找不到圖片" });
            var etag = $"\"img-{image.Id}\"";
            Response.Headers.CacheControl = "public, max-age=31536000, immutable";
            Response.Headers.ETag = etag;
            if (string.Equals(Request.Headers.IfNoneMatch.ToString(), etag, StringComparison.Ordinal))
                return StatusCode(StatusCodes.Status304NotModified);
            return PhysicalFile(path, image.Mime);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            if (!long.TryParse(id, out var imageId))
                return NotFound(new { message = "找不到圖片" });
            var image = await _context.Images.FirstOrDefaultAsync(i => i.Id == imageId);
            if (image is null)
                return NotFound(new { message = "找不到圖片" });
            ImageStorage.RemoveImageFile(image.EntityType, image.EntityId, image.FileName);
            _context.Images.Remove(image);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        private void ReplaceKind(string entityType, int entityId, string kind)
        {
            var rows = _context.Images
                .Where(i => i.EntityType == entityType && i.EntityId == entityId && i.Kind == kind)
                .ToList();
            foreach (var row in rows)
                ImageStorage.RemoveImageFile(row.EntityType, row.EntityId, row.FileName);
            _context.Images.RemoveRange(rows);
            _context.SaveChanges();
        }

        private async Task<Image> InsertImageAsync(IFormCollection form, IFormFile file, string entityType, int entityId, string kind, string widthKey, string heightKey)
        {
            using var stream = new MemoryStream();
            await file.CopyToAsync(stream);
            var image = new Image
            {
                EntityType = entityType,
                EntityId = entityId,
                Kind = kind,
                FileName = ImageStorage.SaveImageFile(stream.ToArray(), entityType, entityId, file.ContentType),
                Mime = file.ContentType,
                Width = ParseDim(form, widthKey),
                Height = ParseDim(form, heightKey),
                SizeBytes = file.Length,
                CreatedAt = DateTime.UtcNow.ToString("yyyy-MM-dd'T'HH:mm:ss.fff'Z'"),
            };
            _context.Images.Add(image);
            await _context.SaveChangesAsync();
            return image;
        }

        private static int? ParseDim(IFormCollection form, string key)
        {
            var value = form.TryGetValue(key, out var values) ? values.ToString() : null;
            return (int.TryParse(value, out var n) && n > 0) ? n : null;
        }
    }
}
