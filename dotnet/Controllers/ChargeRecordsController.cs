using dotnet.Services;
using dotnet.Models;
using Microsoft.AspNetCore.Mvc;

namespace dotnet.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ChargeRecordsController : Controller
    {
        private IChargeRecordService _chargeRecordService;
        public ChargeRecordsController(IChargeRecordService service) { _chargeRecordService = service; }

        [HttpGet("{id}")]
        public async Task<IActionResult> Get(int id)
        {
            var records = await _chargeRecordService.GetAllAsync(id);
            return (records.Any()) ? Ok(records) : NoContent();
        }
        [HttpPost("{id}")]
        public async Task<IActionResult> Post(int id, [FromBody] ChargeRecordDto req)
        {
            var ok = await _chargeRecordService.AddAsync(id, req);
            return ok ? Created() : NotFound(new { message = "找不到車輛" });
        }
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id, [FromQuery] int odm)
        {
            var result = await _chargeRecordService.DeleteByOdmAsync(id, odm);
            return result ? NoContent() : NotFound(id);
        }
        [HttpPut("{vehicleId}/{id:long}")]
        public async Task<IActionResult> Put(int vehicleId, long id, [FromBody] ChargeRecordDto req)
        {
            var result = await _chargeRecordService.UpdateAsync(vehicleId, id, req);
            return result switch
            {
                UpdateOutcome.Updated => Ok(new { message = "充電記錄已更新" }),
                UpdateOutcome.Conflict => Conflict(new { message = "充電記錄已存在" }),
                _ => NotFound(new { message = "找不到充電記錄" }),
            };
        }
    }
}
