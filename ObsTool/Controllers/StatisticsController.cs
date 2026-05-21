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
        private readonly CurrentUserService _currentUserService;

        public StatisticsController(StatisticsService statisticsService, CurrentUserService currentUserService)
        {
            _statisticsService = statisticsService;
            _currentUserService = currentUserService;
        }

        [HttpGet()]
        public IActionResult Get()
        {
            var userId = _currentUserService.GetRequiredUserId();
            return Ok(_statisticsService.GetStatistics(userId));
        }

        [HttpGet("constellations/{constellation}/h2500")]
        public IActionResult GetH2500ObjectsForConstellationMap([FromRoute] string constellation)
        {
            var userId = _currentUserService.GetRequiredUserId();
            return Ok(_statisticsService.GetH2500ObjectsForConstellationMap(constellation, userId));
        }
    }
}
