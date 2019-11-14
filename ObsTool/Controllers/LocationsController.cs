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
using Microsoft.AspNetCore.Authorization;

namespace ObsTool.Controllers
{
    [Produces("application/json")]
    [Route("api/Locations")]
    public class LocationsController : Controller
    {
        private LocationsRepo _locationsRepository;
        private ObsSessionsRepo _obsSessionsRepository;
        private readonly IMapper _mapper;

        public LocationsController(LocationsRepo locationsRepository, ObsSessionsRepo obsSessionsRepository, IMapper mapper)
        {
            _locationsRepository = locationsRepository;
            _obsSessionsRepository = obsSessionsRepository;
            _mapper = mapper;
        }

        // GET: api/Locations
        [AllowAnonymous]
        [HttpGet]
        public IActionResult Get()
        {
            var locations = _locationsRepository.GetLocations();
            var sortedLocations = locations.OrderByDescending(loc => loc.Id);
            var results = _mapper.Map<IEnumerable<LocationDto>>(sortedLocations);
            return Ok(results);
        }

        // GET: api/Locations/5
        [AllowAnonymous]
        [HttpGet("{id}", Name = "GetOneLocation")]
        public IActionResult Get(int id)
        {
            var location = _locationsRepository.GetLocation(id);

            if (location == null)
            {
                return NotFound();
            }

            var locationDto = _mapper.Map<LocationDto>(location);

            return Ok(locationDto);
        }
        
        // POST: api/Locations
        [HttpPost]
        public IActionResult Post([FromBody]LocationDtoForCreation locationDto)
        {
            Location locationEntity = _mapper.Map<Location>(locationDto);

            Location addedLocation = _locationsRepository.AddLocation(locationEntity);

            if (addedLocation == null)
            {
                return StatusCode(500, "Something went wrong creating a location");
            }

            LocationDto addedLocationDto = _mapper.Map<LocationDto>(addedLocation);
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

            if (string.IsNullOrEmpty(locationDto.Name) && string.IsNullOrEmpty(locationDto.Longitude)
                && string.IsNullOrEmpty(locationDto.Latitude) && string.IsNullOrEmpty(locationDto.GoogleMapsAddress))
            {
                return StatusCode(500, "Must provide some data");
            }

            Location locationEntity = _locationsRepository.GetLocation(id);
            if (locationEntity == null)
            {
                return NotFound();
            }

            _mapper.Map(locationDto, locationEntity);

            var result = _locationsRepository.SaveChanges();
            if (!result)
            {
                return StatusCode(500, "Something went wrong updating the location");
            }

            LocationDto locationDtoUpdated = _mapper.Map<LocationDto>(locationEntity);
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
