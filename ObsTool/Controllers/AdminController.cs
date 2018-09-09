using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ObsTool.Entities;
using Microsoft.AspNetCore.Mvc;

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