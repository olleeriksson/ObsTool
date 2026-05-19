using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using ObsTool.Models;
using ObsTool.Services;

namespace ObsTool.Controllers
{
    [ApiController]
    [Route("api/diagnostics/email")]
    public class EmailDiagnosticsController : ControllerBase
    {
        private readonly IMailService _mailService;

        public EmailDiagnosticsController(IMailService mailService)
        {
            _mailService = mailService;
        }

        [HttpGet("settings")]
        public IActionResult GetSettings()
        {
            return Ok(_mailService.GetSettings());
        }

        [HttpPost("test")]
        public async Task<IActionResult> SendTestEmailAsync([FromBody] EmailTestRequestDto requestDto)
        {
            try
            {
                var triggeredBy = User.FindFirstValue(ClaimTypes.Name);
                var result = await _mailService.SendTestEmailAsync(requestDto, triggeredBy);
                return Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new ErrorDetails
                {
                    StatusCode = 400,
                    Message = ex.Message
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new ErrorDetails
                {
                    StatusCode = 400,
                    Message = "Email test failed: " + ex.Message
                });
            }
        }
    }
}
