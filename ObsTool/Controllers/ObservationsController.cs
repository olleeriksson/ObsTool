﻿using System;
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
        private DsoObservationsRepo _dsoObservationsRepo;
        private ObservationsService _observationsService;

        public ObservationsController(ILogger<ObservationsController> logger, MainDbContext mainDbContext, IObsSessionsRepository obsSessionRepository, 
            ObservationsRepo observationsRepo, DsoObservationsRepo dsoObservationsRepo, ObservationsService observationsService)
        {
            _logger = logger;
            _obsSessionsRepository = obsSessionRepository;
            _observationsRepo = observationsRepo;
            _dsoObservationsRepo = dsoObservationsRepo;
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

        [HttpGet("observations/{id}/dso/{dsoId}")]
        public IActionResult GetDsoObservation(int id, int dsoId)
        {
            DsoObservation dsoObservation = _dsoObservationsRepo.GetDsoObservation(id, dsoId);
            if (dsoObservation == null)
            {
                return NotFound();
            }

            DsoObservationDto dsoObservationDto = Mapper.Map<DsoObservationDto>(dsoObservation);
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
