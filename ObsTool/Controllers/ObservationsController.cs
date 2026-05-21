using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using ObsTool.Database;
using ObsTool.Entities;
using ObsTool.Models;
using ObsTool.Services;
using System.Collections.Generic;
using System.Linq;

namespace ObsTool.Controllers
{
    [Produces("application/json")]
    [Route("api/")]
    public class ObservationsController : Controller
    {
        private readonly ILogger<ObservationsController> _logger;
        private ObsSessionsRepo _obsSessionsRepository;
        private ObservationsRepo _observationsRepo;
        private DsoObservationsRepo _dsoObservationsRepo;
        private ObservationsService _observationsService;
        private readonly CurrentUserService _currentUserService;
        private readonly IMapper _mapper;

        public ObservationsController(ILogger<ObservationsController> logger, MainDbContext mainDbContext, ObsSessionsRepo obsSessionRepository,
            ObservationsRepo observationsRepo, DsoObservationsRepo dsoObservationsRepo, ObservationsService observationsService,
            CurrentUserService currentUserService, IMapper mapper)
        {
            _logger = logger;
            _obsSessionsRepository = obsSessionRepository;
            _observationsRepo = observationsRepo;
            _dsoObservationsRepo = dsoObservationsRepo;
            _observationsService = observationsService;
            _currentUserService = currentUserService;
            _mapper = mapper;
        }

        // Note!
        //   Not used by anyone.
        //[HttpGet("observations/", Name = "GetAllForDsos")]
        //public IActionResult GetAllForDsos([FromQuery] string dsoIds, [FromQuery] string dsoName)
        //{
        //    IEnumerable<ObservationDto> observationDtos;

        //    if (dsoIds == null && dsoName == null)  // searching for all
        //    {
        //        observationDtos = _observationsService.GetAllObservationDtosEverMade();
        //    }
        //    else  // searching for specific DSO ids or names
        //    {
        //        if (dsoIds != null && dsoName != null)
        //        {
        //            return BadRequest("Can't specify neither or both of DSO id and a DSO name. Specify one or the other!");
        //        }

        //        List<int> dsoIdsInt = dsoIds.Split(new char[] { ',', ' ' }).Select(id => int.Parse(id)).ToList<int>();
        //        observationDtos = _observationsService.GetAllObservationDtosForMultipleDsoIds(dsoIdsInt);
        //    }

        //    return Ok(observationDtos);
        //}

        [HttpGet("ObsSessions/{obsSessionId}/observations", Name = "GetAllObservationsForObsSession")]
        public IActionResult GetAllObservationsForObsSession(int obsSessionId)
        {
            var userId = _currentUserService.GetRequiredUserId();
            // Get Obs session first
            ObsSession obsSession = _obsSessionsRepository.GetObsSession(obsSessionId, userId);
            if (obsSession == null)
            {
                return NotFound();
            }

            IEnumerable<ObservationDto> observationDto = _mapper.Map<IEnumerable<ObservationDto>>(obsSession.Observations);
            return Ok(observationDto);
        }

        [HttpGet("observations/{id}", Name = "GetOneObservation")]
        public IActionResult Get(int id)
        {
            var userId = _currentUserService.GetRequiredUserId();
            Observation observation = _observationsRepo.GetObservationById(id, userId);
            if (observation == null)
            {
                return NotFound();
            }

            ObservationDto observationDto = _mapper.Map<ObservationDto>(observation);
            return Ok(observationDto);
        }

        [HttpGet("observations/{id}/dso/{dsoId}")]
        public IActionResult GetDsoObservation(int id, int dsoId)
        {
            var userId = _currentUserService.GetRequiredUserId();
            DsoObservation dsoObservation = _dsoObservationsRepo.GetDsoObservation(id, dsoId, userId);
            if (dsoObservation == null)
            {
                return NotFound();
            }

            DsoObservationDto dsoObservationDto = _mapper.Map<DsoObservationDto>(dsoObservation);
            return Ok(dsoObservationDto);
        }

        [HttpDelete("observations/{id}/dso/{dsoId}")]
        public IActionResult DeleteDsoObservation(int id, int dsoId)
        {
            var userId = _currentUserService.GetRequiredUserId();
            DsoObservation dsoObservation = _dsoObservationsRepo.GetDsoObservation(id, dsoId, userId);
            if (dsoObservation == null)
            {
                return NotFound();
            }

            bool result = _dsoObservationsRepo.DeleteDsoObservation(dsoObservation);
            if (!result)
            {
                return StatusCode(500, "Something went wrong deleting the observation session");
            }

            return Ok();
        }
    }
}
