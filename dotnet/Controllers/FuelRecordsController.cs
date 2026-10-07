using dotnet.Services;
using dotnet.Models;
using Microsoft.AspNetCore.Mvc;

namespace dotnet.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class FuelRecordsController : Controller
    {
        private IFuelRecordService _FuelRecordService;
        public FuelRecordsController(IFuelRecordService service) { _FuelRecordService = service; }

        [HttpGet("{id}")]
        public async Task<IActionResult> Get(int id)
        {
            var fuelRecords = await _FuelRecordService.GetAllAsync(id);
            return (fuelRecords.Any()) ? Ok(fuelRecords) : NoContent();
        }
        [HttpPost("{id}")]
        public async Task<IActionResult> Post(int id, [FromBody] FuelRecordDto req)
        {
            var vehicle = await _FuelRecordService.AddAsync(id, req);
            return Created();
        }
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id, [FromQuery] int odm)
        {
            var result = await _FuelRecordService.DeleteByOdmAsync(id, odm);
            return result ? NoContent() : NotFound(id);
        }
        [HttpPut("{vehicleId}/{id:long}")]
        public async Task<IActionResult> Put(int vehicleId, long id, [FromBody] FuelRecordDto req)
        {
            var result = await _FuelRecordService.UpdateAsync(vehicleId, id, req);
            return result switch
            {
                UpdateOutcome.Updated => Ok(new { message = "入油記錄已更新" }),
                UpdateOutcome.Conflict => Conflict(new { message = "入油記錄已存在" }),
                _ => NotFound(new { message = "找不到入油記錄" }),
            };
        }
    }
}
