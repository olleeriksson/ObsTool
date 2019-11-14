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
        private readonly IMapper _mapper;

        public ObservationsController(ILogger<ObservationsController> logger, MainDbContext mainDbContext, ObsSessionsRepo obsSessionRepository,
            ObservationsRepo observationsRepo, DsoObservationsRepo dsoObservationsRepo, ObservationsService observationsService, IMapper mapper)
        {
            _logger = logger;
            _obsSessionsRepository = obsSessionRepository;
            _observationsRepo = observationsRepo;
            _dsoObservationsRepo = dsoObservationsRepo;
            _observationsService = observationsService;
            _mapper = mapper;
        }

        [AllowAnonymous]
        [HttpGet("observations/", Name = "GetAllForDsos")]
        public IActionResult GetAllForDsos([FromQuery] string dsoIds, [FromQuery] string dsoName)
        {
            IEnumerable<ObservationDto> observationDtos;

            if (dsoIds == null && dsoName == null)  // searching for all
            {
                observationDtos = _observationsService.GetAllObservationDtos();
            }
            else  // searching for specific DSO ids or names
            {
                if (dsoIds != null && dsoName != null)
                {
                    return BadRequest("Can't specify neither or both of DSO id and a DSO name. Specify one or the other!");
                }

                List<int> dsoIdsInt = dsoIds.Split(new char[] { ',', ' ' }).Select(id => int.Parse(id)).ToList<int>();
                observationDtos = _observationsService.GetAllObservationDtosForMultipleDsoIds(dsoIdsInt);
            }

            return Ok(observationDtos);
        }

        [AllowAnonymous]
        [HttpGet("ObsSessions/{sessionId}/observations", Name = "GetAllObservationsForObsSession")]
        public IActionResult GetAllObservationsForObsSession(int obsSessionId)
        {
            // Get Obs session first
            ObsSession obsSession = _obsSessionsRepository.GetObsSession(obsSessionId);
            if (obsSession == null)
            {
                return NotFound();
            }

            IEnumerable<ObservationDto> observationDto = _mapper.Map<IEnumerable<ObservationDto>>(obsSession.Observations);
            return Ok(observationDto);
        }

        [AllowAnonymous]
        [HttpGet("observations/{id}", Name = "GetOneObservation")]
        public IActionResult Get(int id)
        {
            Observation observation = _observationsRepo.GetObservationById(id);
            if (observation == null)
            {
                return NotFound();
            }

            ObservationDto observationDto = _mapper.Map<ObservationDto>(observation);
            return Ok(observationDto);
        }

        [AllowAnonymous]
        [HttpGet("observations/{id}/dso/{dsoId}")]
        public IActionResult GetDsoObservation(int id, int dsoId)
        {
            DsoObservation dsoObservation = _dsoObservationsRepo.GetDsoObservation(id, dsoId);
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
            DsoObservation dsoObservation = _dsoObservationsRepo.GetDsoObservation(id, dsoId);
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
