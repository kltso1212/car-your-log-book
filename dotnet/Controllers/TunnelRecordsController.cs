using dotnet.Services;
using dotnet.Models;
using Microsoft.AspNetCore.Mvc;

namespace dotnet.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TunnelRecordsController : Controller
    {
        private ITunnelRecordService _tunnelRecordService;
        public TunnelRecordsController(ITunnelRecordService service) { _tunnelRecordService = service; }

        [HttpGet("{id}")]
        public async Task<IActionResult> Get(string id)
        {
            var records = await _tunnelRecordService.GetAllAsync(id);
            return (records.Any()) ? Ok(records) : NoContent();
        }
        [HttpPost("{id}")]
        public async Task<IActionResult> Post(string id, [FromBody] TunnelRecordDto req)
        {
            var newId = await _tunnelRecordService.AddAsync(id, req);
            return (newId > 0)
                ? CreatedAtAction(nameof(Get), new { id }, new { message = "隧道記錄已新增", id = newId })
                : NotFound(new { message = "找不到車輛" });
        }
        [HttpDelete("{vehicleId}/{id:long}")]
        public async Task<IActionResult> Delete(string vehicleId, long id)
        {
            var result = await _tunnelRecordService.DeleteByIdAsync(vehicleId, id);
            return result ? NoContent() : NotFound(id);
        }
        [HttpPut("{vehicleId}/{id:long}")]
        public async Task<IActionResult> Put(string vehicleId, long id, [FromBody] TunnelRecordDto req)
        {
            var result = await _tunnelRecordService.UpdateAsync(vehicleId, id, req);
            return result switch
            {
                UpdateOutcome.Updated => Ok(new { message = "隧道記錄已更新" }),
                UpdateOutcome.Conflict => Conflict(new { message = "隧道記錄已存在" }),
                _ => NotFound(new { message = "找不到隧道記錄" }),
            };
        }
    }
}
