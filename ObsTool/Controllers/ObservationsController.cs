using System;
using System.Collections;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;
using ObsTool.Entities;
using ObsTool.Models;
using ObsTool.Services;
using AutoMapper;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.JsonPatch;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace ObsTool.Controllers
{
    [Produces("application/json")]
    [Route("api/")]
    public class ObservationsController : Controller
    {
        private ILogger<ObservationsController> _logger;
        private IObsSessionsRepository _obsSessionsRepository;
        private ObservationsRepo _observationsRepo;
        private ObservationsService _observationsService;

        public ObservationsController(ILogger<ObservationsController> logger, MainDbContext mainDbContext, IObsSessionsRepository obsSessionRepository, 
            ObservationsRepo observationsRepo, ObservationsService observationsService)
        {
            _logger = logger;
            _obsSessionsRepository = obsSessionRepository;
            _observationsRepo = observationsRepo;
            _observationsService = observationsService;
        }

        [HttpGet("observations/", Name = "GetAllForDsos")]
        public IActionResult GetAllForDsos([FromQuery] string dsoIds, [FromQuery] string dsoName)
        {
            if ((dsoIds == null && dsoName == null) || (dsoIds != null && dsoName != null))
            {
                return BadRequest("Can't specify neither or both of DSO id and a DSO name. Specify one or the other!");
            }

            // Split and convert to an int array
            int[] dsoIdsInt = dsoIds.Split(new char[] { ',', ' ' }).Select(id => int.Parse(id)).ToArray();

            IEnumerable<ObservationDto> observationDtos = _observationsService.GetAllObservationDtosForMultipleDsoIds(dsoIdsInt);

            return Ok(observationDtos);
        }

        [HttpGet("ObsSessions/{sessionId}/observations", Name = "GetAllObservationsForObsSession")]
        public IActionResult GetAllObservationsForObsSession(int obsSessionId)
        {
            // Get Obs session first
            ObsSession obsSession = _obsSessionsRepository.GetObsSession(obsSessionId);
            if (obsSession == null)
            {
                return NotFound();
            }

            IEnumerable<ObservationDto> observationDto = Mapper.Map<IEnumerable<ObservationDto>>(obsSession.Observations);
            return Ok(observationDto);
        }

        [HttpGet("observations/{id}", Name = "GetOneObservation")]
        public IActionResult Get(int id)
        {
            Observation observation = _observationsRepo.GetObservationById(id);
            if (observation == null)
            {
                return NotFound();
            }

            ObservationDto observationDto = Mapper.Map<ObservationDto>(observation);
            return Ok(observationDto);
        }
    }
}
