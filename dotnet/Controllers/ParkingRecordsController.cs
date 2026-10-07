using dotnet.Services;
using dotnet.Models;
using Microsoft.AspNetCore.Mvc;

namespace dotnet.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ParkingRecordsController : Controller
    {
        private IParkingRecordService _parkingRecordService;
        public ParkingRecordsController(IParkingRecordService service) { _parkingRecordService = service; }

        [HttpGet("{id}")]
        public async Task<IActionResult> Get(int id)
        {
            var records = await _parkingRecordService.GetAllAsync(id);
            return (records.Any()) ? Ok(records) : NoContent();
        }
        [HttpPost("{id}")]
        public async Task<IActionResult> Post(int id, [FromBody] ParkingRecordDto req)
        {
            var newId = await _parkingRecordService.AddAsync(id, req);
            return (newId > 0)
                ? CreatedAtAction(nameof(Get), new { id }, new { message = "泊車記錄已新增", id = newId })
                : NotFound(new { message = "找不到車輛" });
        }
        [HttpDelete("{vehicleId}/{id:long}")]
        public async Task<IActionResult> Delete(int vehicleId, long id)
        {
            var result = await _parkingRecordService.DeleteByIdAsync(vehicleId, id);
            return result ? NoContent() : NotFound(id);
        }
        [HttpPut("{vehicleId}/{id:long}")]
        public async Task<IActionResult> Put(int vehicleId, long id, [FromBody] ParkingRecordDto req)
        {
            var result = await _parkingRecordService.UpdateAsync(vehicleId, id, req);
            return result switch
            {
                UpdateOutcome.Updated => Ok(new { message = "泊車記錄已更新" }),
                UpdateOutcome.Conflict => Conflict(new { message = "泊車記錄已存在" }),
                _ => NotFound(new { message = "找不到泊車記錄" }),
            };
        }
    }
}
