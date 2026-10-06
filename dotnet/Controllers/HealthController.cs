using Microsoft.AspNetCore.Mvc;

namespace dotnet.Controllers
{
    // Liveness probe for Docker / Cloud Run / Render / Railway health checks.
    [Route("health")]
    [ApiController]
    public class HealthController : Controller
    {
        [HttpGet]
        public IActionResult Get() => Ok(new { status = "ok" });
    }
}
