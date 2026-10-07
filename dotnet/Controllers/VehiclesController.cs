using dotnet.Services;
using dotnet.Models;
using Microsoft.AspNetCore.Mvc;

namespace dotnet.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class VehiclesController : Controller
    {
        private IVehicleService _vehicleService;
        public VehiclesController(IVehicleService service) { _vehicleService = service; }

        [HttpGet]
        public async Task<IActionResult> Get()
        {
            var vehicles = await _vehicleService.GetAllAsync();
            return Ok(vehicles);
        }
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var vehicle = await _vehicleService.GetByIdAsync(id);
            return (vehicle is null) ? NotFound() : Ok(vehicle);
        }
        [HttpPost]
        public async Task<IActionResult> Post([FromBody] VehicleDto req)
        {
            if (req.Type < 1 || req.Type > 4)
                return BadRequest(new { message = "車輛類別無效" });
            if (string.IsNullOrWhiteSpace(req.Plate))
                return BadRequest(new { message = "車牌無效" });
            if (!VehicleService.IsValidYear(req.Year))
                return BadRequest(new { message = "年份無效" });
            var id = await _vehicleService.AddAsync(req);
            return Ok(new { message = "車輛註冊成功", id });
        }
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Put(int id, [FromBody] VehicleDto req)
        {
            if (req.Type < 1 || req.Type > 4)
                return BadRequest(new { message = "車輛類別無效" });
            if (string.IsNullOrWhiteSpace(req.Plate))
                return BadRequest(new { message = "車牌無效" });
            if (!VehicleService.IsValidYear(req.Year))
                return BadRequest(new { message = "年份無效" });
            var result = await _vehicleService.UpdateAsync(id, req);
            return result ? Ok(new { message = "車輛已更新" }) : NotFound(new { message = "找不到車輛" });
        }
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _vehicleService.DeleteByIdAsync(id);
            return result ? NoContent() : NotFound(id);
        }
    }
}
