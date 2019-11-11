using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using ObsTool.Database;
using ObsTool.Entities;
using ObsTool.Models;
using ObsTool.Services;
using ObsTool.Utils;
using System.Collections.Generic;
using System.Linq;

namespace ObsTool.Controllers
{
    [Produces("application/json")]
    [Route("api/ObsSessions")]
    public class ObsSessionsController : Controller
    {
        private ILogger<ObsSessionsController> _logger;
        private MainDbContext _mainDbContext;
        private ObsSessionsRepo _obsSessionsRepository;
        private LocationsRepo _locationsRepository;
        private readonly IDsoRepo _dsoRepo;
        private ReportTextManager _reportTextManager;
        ObservationsService _observationsService;
        private readonly IMapper _mapper;

        public ObsSessionsController(ILogger<ObsSessionsController> logger, MainDbContext mainDbContext,
            ObsSessionsRepo obsSessionRepository, LocationsRepo locationsRepository, IDsoRepo dsoRepo,
            ReportTextManager reportTextManager, ObservationsService observationsService, IMapper mapper)
        {
            _logger = logger;
            _mainDbContext = mainDbContext;
            _obsSessionsRepository = obsSessionRepository;
            _locationsRepository = locationsRepository;
            _dsoRepo = dsoRepo;
            _reportTextManager = reportTextManager;
            _observationsService = observationsService;
            _mapper = mapper;
        }

        // GET: api/ObsSession
        [HttpGet]
        public IActionResult Get(bool includeLocation = false, bool simple = false)
        {
            var obsSessions = _obsSessionsRepository.GetObsSessions(includeLocation, includeReportText: simple);

            if (simple)
            {
                var results = _mapper.Map<IEnumerable<ObsSessionDtoSimple>>(obsSessions);
                return Ok(results);
            }
            else
            {
                var results = _mapper.Map<IEnumerable<ObsSessionDto>>(obsSessions);
                return Ok(results);
            }
        }

        // GET: api/ObsSession/5
        [HttpGet("{id}", Name = "GetOneObsSession")]
        public IActionResult Get(int id, bool includeLocation = false, bool includeObservations = false,
            bool includeDso = false, bool includeOtherObservations = false)
        {
            //ObsSessionDto session = Store.Current.ObsSessions.FirstOrDefault(s => s.Id == id);
            //IEnumerable<ObsSessionDto> sessions = Store.Current.ObsSessions;

            //ObsSessionDto session = Store.Current.ObsSessions.FirstOrDefault(s => s.Id == id);
            //ObsSessionDto session = Store.Current.ObsSessions.Where(s => s.Id == id).FirstOrDefault();
            //ObsSessionDto session = (from s in Store.Current.ObsSessions where s.Id == id select s).FirstOrDefault();

            ObsSession obsSession = _obsSessionsRepository.GetObsSession(id, includeLocation, includeObservations, includeDso);
            if (obsSession == null)
            {
                return NotFound();
            }

            var obsSessionDto = _mapper.Map<ObsSessionDto>(obsSession);

            // Retrieving also all the earlier/other observations of these objects will make this the biggest query ever :)
            if (includeOtherObservations)
            {
                // Get the list of all DSO id's
                List<int> dsoIds = obsSession.Observations.SelectMany(obs => obs.DsoObservations.Select(dsoObs => dsoObs.DsoId)).ToList<int>();

                // We need to know which are the primary observation id's so we can filter them out
                int[] primaryObservationIds = obsSession.Observations.Select(o => o.Id).ToArray();

                var mapOfOtherObservations = _observationsService.GetAllObservationDtosMappedByDsoIdForMultipleDsoIds(
                    dsoIds, exludeObservationIds: primaryObservationIds);

                // Go through each observation and..
                foreach (var observationDto in obsSessionDto.Observations)
                {
                    observationDto.OtherObservations = new List<ObservationDto>();

                    // ..and each DsoObservation (observed object)..
                    foreach (var dsoObservation in observationDto.DsoObservations)
                    {
                        // ..and add any other observations for that DSO object to this observation
                        if (mapOfOtherObservations.ContainsKey(dsoObservation.DsoId))
                        {
                            var allObservationsOfDso = mapOfOtherObservations[dsoObservation.DsoId];
                            observationDto.OtherObservations.AddRange(allObservationsOfDso);
                        }
                    }
                }
            }

            return Ok(obsSessionDto);
        }

        [HttpPost]
        public IActionResult Post([FromBody]ObsSessionDtoForCreation newObsSessionDto)
        {
            ObsSession obsSession = _mapper.Map<ObsSession>(newObsSessionDto);

            // Lookup and verify the location id
            if (newObsSessionDto.LocationId != null)
            {
                Location locationEntity = _locationsRepository.GetLocation(newObsSessionDto.LocationId ?? 0);
                if (locationEntity == null)
                {
                    return BadRequest("Invalid LocationId");
                }
                obsSession.Location = locationEntity;
            }

            ObsSession addedObsSession = _obsSessionsRepository.AddObsSession(obsSession);

            if (addedObsSession == null)
            {
                return StatusCode(500, "Something went wrong creating an observation session");
            }

            _mainDbContext.SaveChanges();

            _reportTextManager.ParseAndStoreObservations(addedObsSession);

            _logger.LogInformation("Created an observation session:");
            _logger.LogInformation(PocoPrinter.ToString(addedObsSession));

            ObsSessionDto addedObsSessionDto = _mapper.Map<ObsSessionDto>(addedObsSession);

            return CreatedAtRoute("GetOneObsSession", new { id = addedObsSessionDto.Id }, addedObsSessionDto);
        }

        [HttpPut("{id}")]
        public IActionResult Put(int id, [FromBody] ObsSessionDtoForUpdate obsSessionDtoForUpdate)
        {
            if (obsSessionDtoForUpdate == null)
            {
                return BadRequest();
            }

            ObsSession obsSessionEntity = _obsSessionsRepository.GetObsSession(id, true, true, true);
            if (obsSessionEntity == null)
            {
                return NotFound();
            }

            // Lookup and verify the location id
            if (obsSessionDtoForUpdate.LocationId != null)
            {
                Location locationEntity = _locationsRepository.GetLocation(obsSessionDtoForUpdate.LocationId ?? 0);
                if (locationEntity == null)
                {
                    return NotFound($"Invalid LocationId {obsSessionDtoForUpdate.LocationId}");
                }
                obsSessionEntity.Location = locationEntity;
            }

            _mapper.Map(obsSessionDtoForUpdate, obsSessionEntity);

            _reportTextManager.ParseAndStoreObservations(obsSessionEntity);

            var result = _obsSessionsRepository.SaveChanges();
            if (!result)
            {
                return StatusCode(500, "Something went wrong updating the observation session");
            }

            _logger.LogInformation("Updated an observation session:");
            _logger.LogInformation(PocoPrinter.ToString(obsSessionEntity));

            ObsSession freshObsSessionEntity = _obsSessionsRepository.GetObsSession(id, true, true, true);
            var resultingDto = _mapper.Map<ObsSessionDto>(freshObsSessionEntity);

            return Ok(resultingDto);
        }

        [HttpDelete("{id}")]
        public IActionResult Delete(int id)
        {
            ObsSession obsSessionEntity = _obsSessionsRepository.GetObsSession(id);
            if (obsSessionEntity == null)
            {
                return NotFound();
            }


            bool result = _obsSessionsRepository.DeleteObsSession(obsSessionEntity);
            if (!result)
            {
                return StatusCode(500, "Something went wrong deleting the observation session");
            }

            _logger.LogInformation("Deleted an observation session:");
            _logger.LogInformation(PocoPrinter.ToString(obsSessionEntity));

            return Ok();
        }
    }
}
