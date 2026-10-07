using dotnet.Services;
using dotnet.Models;
using Microsoft.AspNetCore.Mvc;

namespace dotnet.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class InsuranceRecordsController : Controller
    {
        private IInsuranceRecordService _service;
        public InsuranceRecordsController(IInsuranceRecordService service) { _service = service; }

        [HttpGet("{id}")]
        public async Task<IActionResult> Get(int id)
        {
            var records = await _service.GetAllAsync(id);
            return (records.Any()) ? Ok(records) : NoContent();
        }
        [HttpPost("{id}")]
        public async Task<IActionResult> Post(int id, [FromBody] InsuranceRecordDto req)
        {
            var newId = await _service.AddAsync(id, req);
            return newId switch
            {
                > 0 => CreatedAtAction(nameof(Get), new { id }, new { message = "保險記錄已新增", id = newId }),
                -1 => Conflict(new { message = "保險記錄已存在" }),
                _ => NotFound(new { message = "找不到車輛" }),
            };
        }
        [HttpDelete("{vehicleId}/{id:long}")]
        public async Task<IActionResult> Delete(int vehicleId, long id)
        {
            var result = await _service.DeleteByIdAsync(vehicleId, id);
            return result ? NoContent() : NotFound(id);
        }
        [HttpPut("{vehicleId}/{id:long}")]
        public async Task<IActionResult> Put(int vehicleId, long id, [FromBody] InsuranceRecordDto req)
        {
            var result = await _service.UpdateAsync(vehicleId, id, req);
            return result switch
            {
                UpdateOutcome.Updated => Ok(new { message = "保險記錄已更新" }),
                UpdateOutcome.Conflict => Conflict(new { message = "保險記錄已存在" }),
                _ => NotFound(new { message = "找不到保險記錄" }),
            };
        }
    }

    [Route("api/[controller]")]
    [ApiController]
    public class LicenceRecordsController : Controller
    {
        private ILicenceRecordService _service;
        public LicenceRecordsController(ILicenceRecordService service) { _service = service; }

        [HttpGet("{id}")]
        public async Task<IActionResult> Get(int id)
        {
            var records = await _service.GetAllAsync(id);
            return (records.Any()) ? Ok(records) : NoContent();
        }
        [HttpPost("{id}")]
        public async Task<IActionResult> Post(int id, [FromBody] LicenceRecordDto req)
        {
            var newId = await _service.AddAsync(id, req);
            return newId switch
            {
                > 0 => CreatedAtAction(nameof(Get), new { id }, new { message = "牌費記錄已新增", id = newId }),
                -1 => Conflict(new { message = "牌費記錄已存在" }),
                _ => NotFound(new { message = "找不到車輛" }),
            };
        }
        [HttpDelete("{vehicleId}/{id:long}")]
        public async Task<IActionResult> Delete(int vehicleId, long id)
        {
            var result = await _service.DeleteByIdAsync(vehicleId, id);
            return result ? NoContent() : NotFound(id);
        }
        [HttpPut("{vehicleId}/{id:long}")]
        public async Task<IActionResult> Put(int vehicleId, long id, [FromBody] LicenceRecordDto req)
        {
            var result = await _service.UpdateAsync(vehicleId, id, req);
            return result switch
            {
                UpdateOutcome.Updated => Ok(new { message = "牌費記錄已更新" }),
                UpdateOutcome.Conflict => Conflict(new { message = "牌費記錄已存在" }),
                _ => NotFound(new { message = "找不到牌費記錄" }),
            };
        }
    }
}
