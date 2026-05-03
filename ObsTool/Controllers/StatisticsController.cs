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
    }
}
