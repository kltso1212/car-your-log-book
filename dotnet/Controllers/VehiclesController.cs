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
            return (vehicles.Any()) ? Ok(vehicles) : NoContent();
        }
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            var vehicle = await _vehicleService.GetByIdAsync(id);
            return (vehicle is null) ? NotFound() : Ok(vehicle);
        }
        [HttpPost]
        public async Task<IActionResult> Post([FromBody] VehicleDto req)
        {
            if (req.Type < 1 || req.Type > 4)
                return BadRequest(new { message = "車輛類別無效" });
            var vehicle = await _vehicleService.AddAsync(req);
            return Created();
        }
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var result = await _vehicleService.DeleteByIdAsync(id);
            return result ? NoContent() : NotFound(id);
        }
    }
}
