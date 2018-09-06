using System;
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

        public ObsResourcesController(ObsResourcesRepo obsResourceRepo, ObservationsRepo observationsRepo, ILogger<ObsResourcesController> logger)
        {
            _obsResourceRepo = obsResourceRepo;
            //_obsSessionsRepository = obsSessionsRepository;
            _observationsRepo = observationsRepo;
            _logger = logger;
        }

        [HttpGet]
        [Route("resources")]
        public IActionResult Get()
        {
            var resources = _obsResourceRepo.GetAllResources();
            var results = Mapper.Map<IEnumerable<ObsResourceDto>>(resources);
            return Ok(results);
        }

        [HttpGet("resources/{resourceId}", Name = "GetOneObsResource")]
        public IActionResult Get(int resourceId)
        {
            ObsResource obsResource = _obsResourceRepo.GetOneResource(resourceId);
            if (obsResource == null)
            {
                return NotFound();
            }
            return Ok(Mapper.Map<ObsResourceDto>(obsResource));
        }

        [HttpGet("observations/{observationId}/resources", Name = "GetAllResourcesForObservation")]
        public IActionResult GetAllResourcesForObsSession(int observationId)
        {
            // Get Obs session first
            Observation observation = _observationsRepo.GetObservationById(observationId);
            if (observation == null)
            {
                return NotFound();
            }

            IEnumerable<ObsResourceDto> resourceDtos = Mapper.Map<IEnumerable<ObsResourceDto>>(observation.ObsResources);
            return Ok(resourceDtos);
        }

        [HttpPost("observations/{observationId}/resources")]
        public IActionResult Post(int observationId, [FromBody] ObsResourceDtoForCreationAndUpdate newObsResourceDto)
        {
            ObsResource newObsResource = Mapper.Map<ObsResource>(newObsResourceDto);

            // Verify the type
            if (newObsResourceDto.Type != "sketch" && newObsResourceDto.Type != "image" && newObsResourceDto.Type != "link")
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

            ObsResourceDto addedObsResourceDto = Mapper.Map<ObsResourceDto>(addedObsResource);

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
            if (obsResourceDtoForUpdate.Type != "sketch" && obsResourceDtoForUpdate.Type != "image" && obsResourceDtoForUpdate.Type != "link")
            {
                return BadRequest("Invalid type");
            }

            Mapper.Map(obsResourceDtoForUpdate, obsResourceEntity);

            _obsResourceRepo.SaveChanges();

            _logger.LogInformation("Updated a resource:");
            _logger.LogInformation(PocoPrinter.ToString(obsResourceEntity));

            ObsResource freshObsResourceEntity = _obsResourceRepo.GetOneResource(resourceId);
            var resultingDto = Mapper.Map<ObsResourceDto>(freshObsResourceEntity);

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
