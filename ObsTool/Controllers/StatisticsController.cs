using Microsoft.AspNetCore.Mvc;
using ObsTool.Database;
using ObsTool.Entities;
using ObsTool.Models;
using ObsTool.Services;

namespace ObsTool.Controllers
{
    [Produces("application/json")]
    [Route("api/statistics")]
    public class StatisticsController : Controller
    {
        private ObsSessionsRepo _obsSessionsRepository;
        private LocationsRepo _locationsRepository;
        private IDsoRepo _dsoRepo;
        private ObservationsRepo _observationsRepo;
        private ObsResourcesRepo _obsResourceRepo;

        public StatisticsController(MainDbContext mainDbContext, ObsSessionsRepo obsSessionRepository,
            LocationsRepo locationsRepository, IDsoRepo dsoRepo, ObservationsRepo observationsRepo,
            ObsResourcesRepo obsResourceRepo)
        {
            _obsSessionsRepository = obsSessionRepository;
            _locationsRepository = locationsRepository;
            _dsoRepo = dsoRepo;
            _observationsRepo = observationsRepo;
            _obsResourceRepo = obsResourceRepo;
        }

        [HttpGet()]
        public IActionResult Get()
        {
            StatisticsDto statsDto = new StatisticsDto
            {
                NumObsSessions = _obsSessionsRepository.GetNumObsSessions(),
                NumObservations = _observationsRepo.GetNumObservations(),
                NumObservedObjects = _observationsRepo.GetNumObservedObjects(),
                NumObservedGalaxies = _observationsRepo.GetNumObservedGalaxies(),
                NumObservedBrightNebulae = _observationsRepo.GetNumObservedBrightNebulae(),
                NumObservedDarkNebulae = _observationsRepo.GetNumObservedDarkNebulae(),
                NumObservedOpenClusters = _observationsRepo.GetNumObservedOpenClusters(),
                NumObservedPlanetaryNebulae = _observationsRepo.GetNumObservedPlanetaryNebulae(),
                NumObservedGlobularClusters = _observationsRepo.GetNumObservedGlobularClusters(),
                NumObservedMessierObjects = _observationsRepo.GetNumObservedMessierObjects(),
                NumObservedNGCObjects = _observationsRepo.GetNumObservedNGCObjects(),
                NumLocations = _locationsRepository.GetNumLocations(),
                NumDsoInDatabase = _dsoRepo.GetNumDsoInDatabase(),
                NumSketches = _obsResourceRepo.GetNumSketches(),
                NumDetections = _observationsRepo.GetNumDetections(),
                NumNonDetections = _observationsRepo.GetNumNonDetections()
            };

            return Ok(statsDto);
        }

    }
}
