﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ObsTool.Entities;
using ObsTool.Models;
using ObsTool.Services;
using AutoMapper;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using ObsTool.Utils;
using Microsoft.AspNetCore.Authorization;

namespace ObsTool.Controllers
{
    [Produces("application/json")]
    [Route("api/")]
    public class ObsResourcesController : Controller
    {
        private ObsResourcesRepo _obsResourceRepo;
        //private IObsSessionsRepository _obsSessionsRepository;
        private ObservationsRepo _observationsRepo;
        private ILogger<ObsResourcesController> _logger;
        private readonly IMapper _mapper;

        public ObsResourcesController(ObsResourcesRepo obsResourceRepo, ObservationsRepo observationsRepo, ILogger<ObsResourcesController> logger, IMapper mapper)
        {
            _obsResourceRepo = obsResourceRepo;
            //_obsSessionsRepository = obsSessionsRepository;
            _observationsRepo = observationsRepo;
            _logger = logger;
            _mapper = mapper;
        }

        [AllowAnonymous]
        [HttpGet]
        [Route("resources")]
        public IActionResult Get()
        {
            var resources = _obsResourceRepo.GetAllResources();
            var results = _mapper.Map<IEnumerable<ObsResourceDto>>(resources);
            return Ok(results);
        }

        [AllowAnonymous]
        [HttpGet("resources/{resourceId}", Name = "GetOneObsResource")]
        public IActionResult Get(int resourceId)
        {
            ObsResource obsResource = _obsResourceRepo.GetOneResource(resourceId);
            if (obsResource == null)
            {
                return NotFound();
            }
            return Ok(_mapper.Map<ObsResourceDto>(obsResource));
        }

        [AllowAnonymous]
        [HttpGet("observations/{observationId}/resources", Name = "GetAllResourcesForObservation")]
        public IActionResult GetAllResourcesForObsSession(int observationId)
        {
            // Get Obs session first
            Observation observation = _observationsRepo.GetObservationById(observationId);
            if (observation == null)
            {
                return NotFound();
            }

            IEnumerable<ObsResourceDto> resourceDtos = _mapper.Map<IEnumerable<ObsResourceDto>>(observation.ObsResources);
            return Ok(resourceDtos);
        }

        [HttpPost("observations/{observationId}/resources")]
        public IActionResult Post(int observationId, [FromBody] ObsResourceDtoForCreationAndUpdate newObsResourceDto)
        {
            ObsResource newObsResource = _mapper.Map<ObsResource>(newObsResourceDto);

            // Verify the type
            if (newObsResourceDto.Type != "sketch" && newObsResourceDto.Type != "jot" && newObsResourceDto.Type != "image" && newObsResourceDto.Type != "link")
            {
                return BadRequest("Invalid type");
            }

            Observation observation = _observationsRepo.GetObservationById(observationId);
            if (observation == null)
            {
                return NotFound("Could not find the observation");
            }

            newObsResource.ObservationId = observation.Id;

            ObsResource addedObsResource = _obsResourceRepo.AddObsResource(newObsResource);

            if (addedObsResource == null)
            {
                return StatusCode(500, "Something went wrong creating a resource");
            }

            _logger.LogInformation("Created a resource:");
            _logger.LogInformation(PocoPrinter.ToString(addedObsResource));

            ObsResourceDto addedObsResourceDto = _mapper.Map<ObsResourceDto>(addedObsResource);

            return CreatedAtRoute("GetOneObsResource", new { resourceId = addedObsResourceDto.Id }, addedObsResourceDto);
        }

        [HttpPut("resources/{resourceId}")]
        public IActionResult Put(int resourceId, [FromBody] ObsResourceDtoForCreationAndUpdate obsResourceDtoForUpdate)
        {
            if (obsResourceDtoForUpdate == null)
            {
                return BadRequest();
            }

            ObsResource obsResourceEntity = _obsResourceRepo.GetOneResource(resourceId);
            if (obsResourceEntity == null)
            {
                return NotFound();
            }

            // Verify the type
            if (obsResourceDtoForUpdate.Type != "sketch" &&
                obsResourceDtoForUpdate.Type != "jot" &&
                obsResourceDtoForUpdate.Type != "image" &&
                obsResourceDtoForUpdate.Type != "link" &&
                obsResourceDtoForUpdate.Type != "aladin")
            {
                return BadRequest("Invalid type");
            }

            _mapper.Map(obsResourceDtoForUpdate, obsResourceEntity);

            _obsResourceRepo.SaveChanges();

            _logger.LogInformation("Updated a resource:");
            _logger.LogInformation(PocoPrinter.ToString(obsResourceEntity));

            ObsResource freshObsResourceEntity = _obsResourceRepo.GetOneResource(resourceId);
            var resultingDto = _mapper.Map<ObsResourceDto>(freshObsResourceEntity);

            return Ok(resultingDto);
        }

        [HttpDelete("resources/{id}")]
        public IActionResult Delete(int id)
        {
            ObsResource obsResourceEntity = _obsResourceRepo.GetOneResource(id);
            if (obsResourceEntity == null)
            {
                return NotFound();
            }

            bool result = _obsResourceRepo.DeleteObsResource(obsResourceEntity);
            if (!result)
            {
                return StatusCode(500, "Something went wrong deleting the resource");
            }

            _logger.LogInformation("Deleted a resource:");
            _logger.LogInformation(PocoPrinter.ToString(obsResourceEntity));

            return Ok();
        }
    }
}
