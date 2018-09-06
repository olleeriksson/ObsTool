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

namespace ObsTool.Controllers
{
    [Produces("application/json")]
    [Route("api/Locations")]
    public class LocationsController : Controller
    {
        private ILocationsRepository _locationsRepository;
        private IObsSessionsRepository _obsSessionsRepository;

        public LocationsController(ILocationsRepository locationsRepository, IObsSessionsRepository obsSessionsRepository)
        {
            _locationsRepository = locationsRepository;
            _obsSessionsRepository = obsSessionsRepository;
        }

        // GET: api/Locations
        [HttpGet]
        public IActionResult Get()
        {
            var locations = _locationsRepository.GetLocations();
            var results = Mapper.Map<IEnumerable<LocationDto>>(locations);
            return Ok(results);
        }

        // GET: api/Locations/5
        [HttpGet("{id}", Name = "GetOneLocation")]
        public IActionResult Get(int id)
        {
            var location = _locationsRepository.GetLocation(id);

            if (location == null)
            {
                return NotFound();
            }

            var locationDto = Mapper.Map<LocationDto>(location);

            return Ok(locationDto);
        }
        
        // POST: api/Locations
        [HttpPost]
        public IActionResult Post([FromBody]LocationDtoForCreation locationDto)
        {
            Location locationEntity = Mapper.Map<Location>(locationDto);

            Location addedLocation = _locationsRepository.AddLocation(locationEntity);

            if (addedLocation == null)
            {
                return StatusCode(500, "Something went wrong creating a location");
            }

            LocationDto addedLocationDto = Mapper.Map<LocationDto>(addedLocation);
            return CreatedAtRoute("GetOneLocation", new { id = addedLocationDto.Id }, addedLocationDto);
        }
        
        // PUT: api/Locations/5
        [HttpPut("{id}")]
        public IActionResult Put(int id, [FromBody] LocationDtoForUpdate locationDto)
        {
            if (locationDto == null)
            {
                return BadRequest();
            }

            Location locationEntity = _locationsRepository.GetLocation(id);
            if (locationEntity == null)
            {
                return NotFound();
            }

            Mapper.Map(locationDto, locationEntity);

            var result = _locationsRepository.SaveChanges();
            if (!result)
            {
                return StatusCode(500, "Something went wrong updating the location");
            }

            LocationDto locationDtoUpdated = Mapper.Map<LocationDto>(locationEntity);
            return Ok(locationDtoUpdated);
        }

        // DELETE: api/ApiWithActions/5
        [HttpDelete("{id}")]
        public IActionResult Delete(int id)
        {
            Location locationEntity = _locationsRepository.GetLocation(id);
            if (locationEntity == null)
            {
                return NotFound();
            }

            bool anyObsSessionReferring = _obsSessionsRepository.GetObsSessions().Any(s => s.LocationId == id);
            if (anyObsSessionReferring)
            {
                return BadRequest("There are observation sessions referring to this location. Can not delete.");
            }

            bool result = _locationsRepository.DeleteLocation(locationEntity);
            if (!result)
            {
                return StatusCode(500, "Something went wrong deleting the location");
            }

            return Ok();
        }
    }
}
