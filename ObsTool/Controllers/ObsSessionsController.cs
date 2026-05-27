using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using ObsTool.Database;
using ObsTool.Entities;
using ObsTool.Models;
using ObsTool.Services;
using ObsTool.Utils;
using System;
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
        private IInstrumentsRepo _instrumentsRepo;
        private IH2500Repo _h2500Repo;
        private readonly IDsoRepo _dsoRepo;
        private ReportTextManager _reportTextManager;
        ObservationsService _observationsService;
        private readonly CurrentUserService _currentUserService;
        private readonly SystemEventService _systemEventService;
        private readonly IMapper _mapper;

        public ObsSessionsController(ILogger<ObsSessionsController> logger, MainDbContext mainDbContext,
            ObsSessionsRepo obsSessionRepository, LocationsRepo locationsRepository, IInstrumentsRepo instrumentsRepo, IDsoRepo dsoRepo,
            IH2500Repo h2500Repo, ReportTextManager reportTextManager, ObservationsService observationsService,
            CurrentUserService currentUserService, SystemEventService systemEventService, IMapper mapper)
        {
            _logger = logger;
            _mainDbContext = mainDbContext;
            _obsSessionsRepository = obsSessionRepository;
            _locationsRepository = locationsRepository;
            _instrumentsRepo = instrumentsRepo;
            _h2500Repo = h2500Repo;
            _dsoRepo = dsoRepo;
            _reportTextManager = reportTextManager;
            _observationsService = observationsService;
            _currentUserService = currentUserService;
            _systemEventService = systemEventService;
            _mapper = mapper;
        }

        // GET: api/ObsSessions
        [HttpGet]
        public IActionResult Get(bool includeLocation = false, bool simple = false)
        {
            var userId = _currentUserService.GetRequiredUserId();
            var obsSessions = _obsSessionsRepository.GetObsSessions(userId, includeLocation, includeReportText: simple);

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

        // GET: api/ObsSessions/5
        [HttpGet("{id}", Name = "GetOneObsSession")]
        public IActionResult Get(int id, bool includeLocation = false, bool includeObservations = false,
            bool includeDso = false, bool includeOtherObservations = false, bool includePrevAndNextObservations = false,
            bool includeHerschel = false)
        {
            //ObsSessionDto session = Store.Current.ObsSessions.FirstOrDefault(s => s.Id == id);
            //IEnumerable<ObsSessionDto> sessions = Store.Current.ObsSessions;

            //ObsSessionDto session = Store.Current.ObsSessions.FirstOrDefault(s => s.Id == id);
            //ObsSessionDto session = Store.Current.ObsSessions.Where(s => s.Id == id).FirstOrDefault();
            //ObsSessionDto session = (from s in Store.Current.ObsSessions where s.Id == id select s).FirstOrDefault();

            var userId = _currentUserService.GetRequiredUserId();
            ObsSession obsSession = _obsSessionsRepository.GetObsSession(id, userId, includeLocation, includeObservations, includeDso);
            if (obsSession == null)
            {
                return NotFound();
            }

            var obsSessionDto = _mapper.Map<ObsSessionDto>(obsSession);
            if (includeHerschel)
            {
                PopulateHerschelBadges(obsSessionDto);
            }

            // Retrieving also all the earlier/other observations of these objects will make this the biggest query ever :)
            if (includeOtherObservations)
            {
                // Get the list of all parsed object keys, regardless of source table.
                List<string> objectKeys = obsSession.Observations
                    .SelectMany(obs => obs.DsoObservations.Select(dsoObs => dsoObs.GetObjectKey()))
                    .Where(objectKey => !string.IsNullOrWhiteSpace(objectKey))
                    .ToList();

                // We need to know which are the primary observation id's so we can filter them out
                int[] primaryObservationIds = obsSession.Observations.Select(o => o.Id).ToArray();

                var mapOfOtherObservations = _observationsService.GetAllObservationDtosMappedByObjectKey(
                    userId, objectKeys, exludeObservationIds: primaryObservationIds, includePrevAndNextObservations);

                // Go through each observation and..
                foreach (var observationDto in obsSessionDto.Observations)
                {
                    observationDto.OtherObservations = new List<ObservationDto>();

                    // ..and each DsoObservation (observed object)..
                    foreach (var dsoObservation in observationDto.DsoObservations)
                    {
                        // ..and add any other observations for that DSO object to this observation
                        if (mapOfOtherObservations.ContainsKey(dsoObservation.ObjectKey))
                        {
                            var allObservationsOfDso = mapOfOtherObservations[dsoObservation.ObjectKey];
                            observationDto.OtherObservations.AddRange(allObservationsOfDso);
                        }
                    }

                    observationDto.OtherObservations = observationDto.OtherObservations
                        .OrderByDescending(o => ParseObservationDateOrMin(o.ObsSession?.Date))
                        .ThenByDescending(o => o.Id)
                        .ToList();
                }
            }

            return Ok(obsSessionDto);
        }

        private static DateTime ParseObservationDateOrMin(string date)
        {
            return DateTime.TryParse(date, out var parsedDate) ? parsedDate : DateTime.MinValue;
        }

        private void PopulateHerschelBadges(ObsSessionDto obsSessionDto)
        {
            var dsoDtos = obsSessionDto.Observations?
                .SelectMany(o => o.DsoObservations)
                .Select(dsoObservation => dsoObservation.Dso)
                .Where(dso => dso != null && dso.ObjectKind == ObservedObjectKind.Sac)
                .GroupBy(dso => dso.Id)
                .Select(g => g.First())
                .ToList();

            if (dsoDtos == null || dsoDtos.Count == 0)
            {
                return;
            }

            var herschelByDsoId = _h2500Repo.GetH2500ObjectsByDsoIds(dsoDtos.Select(d => d.Id))
                .Where(h => h.SacDeepSkyObjectsId != null)
                .GroupBy(h => h.SacDeepSkyObjectsId.Value)
                .ToDictionary(g => g.Key, g => g.Select(h => new HerschelInfoDto
                {
                    HerschelId = h.HerschelId,
                    HerschelNo = h.HerschelNo,
                    H400 = h.H400
                }).ToArray());

            foreach (DsoDto dso in dsoDtos)
            {
                if (herschelByDsoId.ContainsKey(dso.Id))
                {
                    dso.HerschelObjects = herschelByDsoId[dso.Id];
                }
            }
        }

        private ObsSessionDto BuildFullObsSessionDto(int id, int userId, bool includeHerschel)
        {
            // Save responses feed the session page directly, so they need the same hydrated object graph as the full-session GET path.
            var obsSession = _obsSessionsRepository.GetObsSession(id, userId, includeLocation: true, includeObservations: true, includeDso: true);
            var obsSessionDto = _mapper.Map<ObsSessionDto>(obsSession);

            if (includeHerschel)
            {
                PopulateHerschelBadges(obsSessionDto);
            }

            return obsSessionDto;
        }

        [HttpPost]
        public IActionResult Post([FromBody]ObsSessionDtoForCreation newObsSessionDto)
        {
            var userId = _currentUserService.GetRequiredUserId();
            ObsSession obsSession = _mapper.Map<ObsSession>(newObsSessionDto);

            // Lookup and verify the location id
            if (newObsSessionDto.LocationId != null)
            {
                Location locationEntity = _locationsRepository.GetLocation(newObsSessionDto.LocationId ?? 0, userId);
                if (locationEntity == null)
                {
                    return BadRequest("Invalid LocationId");
                }
                obsSession.Location = locationEntity;
            }
            if (newObsSessionDto.InstrumentId != null)
            {
                Instrument instrumentEntity = _instrumentsRepo.GetInstrument(newObsSessionDto.InstrumentId ?? 0, userId);
                if (instrumentEntity == null)
                {
                    return BadRequest("Invalid InstrumentId");
                }
                obsSession.Instrument = instrumentEntity;
            }

            ObsSession addedObsSession = _obsSessionsRepository.AddObsSession(obsSession, userId);

            if (addedObsSession == null)
            {
                return StatusCode(500, "Something went wrong creating an observation session");
            }

            _mainDbContext.SaveChanges();

            _reportTextManager.ParseAndStoreObservations(addedObsSession);

            _logger.LogInformation("Created an observation session:");
            _logger.LogInformation(PocoPrinter.ToString(addedObsSession));
            _systemEventService.RecordObsSessionCreated(userId, addedObsSession);

            ObsSessionDto addedObsSessionDto = BuildFullObsSessionDto(addedObsSession.Id, userId, includeHerschel: true);

            return CreatedAtRoute("GetOneObsSession", new { id = addedObsSessionDto.Id }, addedObsSessionDto);
        }

        [HttpPut("{id}")]
        public IActionResult Put(int id, [FromBody] ObsSessionDtoForUpdate obsSessionDtoForUpdate)
        {
            var userId = _currentUserService.GetRequiredUserId();
            if (obsSessionDtoForUpdate == null)
            {
                return BadRequest();
            }

            ObsSession obsSessionEntity = _obsSessionsRepository.GetObsSession(id, userId, true, true, true);
            if (obsSessionEntity == null)
            {
                return NotFound();
            }

            // Lookup and verify the location id
            if (obsSessionDtoForUpdate.LocationId != null)
            {
                Location locationEntity = _locationsRepository.GetLocation(obsSessionDtoForUpdate.LocationId ?? 0, userId);
                if (locationEntity == null)
                {
                    return NotFound($"Invalid LocationId {obsSessionDtoForUpdate.LocationId}");
                }
                obsSessionEntity.Location = locationEntity;
            }
            if (obsSessionDtoForUpdate.InstrumentId != null)
            {
                Instrument instrumentEntity = _instrumentsRepo.GetInstrument(obsSessionDtoForUpdate.InstrumentId ?? 0, userId);
                if (instrumentEntity == null)
                {
                    return NotFound($"Invalid InstrumentId {obsSessionDtoForUpdate.InstrumentId}");
                }
                obsSessionEntity.Instrument = instrumentEntity;
            }
            else
            {
                obsSessionEntity.Instrument = null;
                obsSessionEntity.InstrumentId = null;
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
            _systemEventService.RecordObsSessionUpdated(userId, obsSessionEntity);

            var resultingDto = BuildFullObsSessionDto(id, userId, includeHerschel: true);

            return Ok(resultingDto);
        }

        [HttpDelete("{id}")]
        public IActionResult Delete(int id)
        {
            var userId = _currentUserService.GetRequiredUserId();
            ObsSession obsSessionEntity = _obsSessionsRepository.GetObsSession(id, userId);
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
