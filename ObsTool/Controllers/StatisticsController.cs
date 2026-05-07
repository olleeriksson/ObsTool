using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ObsTool.Services;

namespace ObsTool.Controllers
{
    [Produces("application/json")]
    [Route("api/statistics")]
    public class StatisticsController : Controller
    {
        private readonly StatisticsService _statisticsService;

        public StatisticsController(StatisticsService statisticsService)
        {
            _statisticsService = statisticsService;
        }

        [AllowAnonymous]
        [HttpGet()]
        public IActionResult Get()
        {
            return Ok(_statisticsService.GetStatistics());
        }

        [AllowAnonymous]
        [HttpGet("constellations/{constellation}/h2500")]
        public IActionResult GetH2500ObjectsForConstellationMap([FromRoute] string constellation)
        {
            return Ok(_statisticsService.GetH2500ObjectsForConstellationMap(constellation));
        }
    }
}
