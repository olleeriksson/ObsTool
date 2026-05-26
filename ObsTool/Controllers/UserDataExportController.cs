using Microsoft.AspNetCore.Mvc;
using ObsTool.Services;

namespace ObsTool.Controllers
{
    [Route("api/UserDataExport")]
    public class UserDataExportController : Controller
    {
        private readonly CurrentUserService _currentUserService;
        private readonly UserDataExportService _userDataExportService;

        public UserDataExportController(CurrentUserService currentUserService, UserDataExportService userDataExportService)
        {
            _currentUserService = currentUserService;
            _userDataExportService = userDataExportService;
        }

        /// <summary>
        /// Downloads the authenticated database user's compact session export.
        /// </summary>
        [HttpGet("simple")]
        public IActionResult GetSimpleExport()
        {
            var userId = _currentUserService.GetRequiredUserId();
            var exportFile = _userDataExportService.CreateSimpleExport(userId);

            return File(exportFile.Contents, exportFile.ContentType, exportFile.FileName);
        }

        /// <summary>
        /// Downloads the authenticated database user's detailed CSV export.
        /// </summary>
        [HttpGet("advanced")]
        public IActionResult GetAdvancedExport()
        {
            var userId = _currentUserService.GetRequiredUserId();
            var exportFile = _userDataExportService.CreateAdvancedExport(userId);

            return File(exportFile.Contents, exportFile.ContentType, exportFile.FileName);
        }
    }
}
