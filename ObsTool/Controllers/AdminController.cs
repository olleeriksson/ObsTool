using Microsoft.AspNetCore.Mvc;
using ObsTool.Database;

namespace ObsTool.Controllers
{
    [Route("api/admin")]
    public class AdminController : Controller
    {
        private MainDbContext _dbContext;

        public AdminController(MainDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        [HttpGet("seeddatabase")]
        public IActionResult Index()
        {
            _dbContext.SeedDatabase();
            return Ok();
        }

        [HttpGet("test")]
        public IActionResult Test()
        {
            return Ok("This is a test: " + Startup.Configuration["CorsAllowedOrigins"]);
        }
    }
}