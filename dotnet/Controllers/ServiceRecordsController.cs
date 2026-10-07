using dotnet.Services;
using dotnet.Models;
using Microsoft.AspNetCore.Mvc;

namespace dotnet.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ServiceRecordsController : Controller
    {
        private IServiceRecordService _serviceRecordService;
        public ServiceRecordsController(IServiceRecordService service) { _serviceRecordService = service; }

        [HttpGet("{id}")]
        public async Task<IActionResult> Get(int id)
        {
            var records = await _serviceRecordService.GetAllAsync(id);
            return (records.Any()) ? Ok(records) : NoContent();
        }
        [HttpPost("{id}")]
        public async Task<IActionResult> Post(int id, [FromBody] ServiceRecordDto req)
        {
            var ok = await _serviceRecordService.AddAsync(id, req);
            return ok ? Created() : Conflict(new { message = "保養記錄已存在" });
        }
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id, [FromQuery] int odm)
        {
            var result = await _serviceRecordService.DeleteByOdmAsync(id, odm);
            return result ? NoContent() : NotFound(id);
        }
        [HttpPut("{vehicleId}/{id:long}")]
        public async Task<IActionResult> Put(int vehicleId, long id, [FromBody] ServiceRecordDto req)
        {
            var result = await _serviceRecordService.UpdateAsync(vehicleId, id, req);
            return result switch
            {
                UpdateOutcome.Updated => Ok(new { message = "保養記錄已更新" }),
                UpdateOutcome.Conflict => Conflict(new { message = "保養記錄已存在" }),
                _ => NotFound(new { message = "找不到保養記錄" }),
            };
        }
    }
}
