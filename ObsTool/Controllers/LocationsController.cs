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
        private readonly CurrentUserService _currentUserService;
        private readonly IMapper _mapper;

        public LocationsController(LocationsRepo locationsRepository, ObsSessionsRepo obsSessionsRepository,
            CurrentUserService currentUserService, IMapper mapper)
        {
            _locationsRepository = locationsRepository;
            _obsSessionsRepository = obsSessionsRepository;
            _currentUserService = currentUserService;
            _mapper = mapper;
        }

        // GET: api/Locations
        [HttpGet]
        public IActionResult Get()
        {
            var userId = _currentUserService.GetRequiredUserId();
            var locations = _locationsRepository.GetLocations(userId);

            // Rank locations using a 50/50 blend of normalized recency and normalized usage count.
            var locationUsage = _obsSessionsRepository.GetObsSessions(userId)
                .Where(s => s.LocationId.HasValue)
                .GroupBy(s => s.LocationId.Value)
                .ToDictionary(
                    g => g.Key,
                    g => new
                    {
                        Count = g.Count(),
                        LatestDate = g.Max(s => s.Date ?? DateTime.MinValue)
                    });

            var maxUsageCount = locationUsage.Count > 0 ? locationUsage.Max(kv => kv.Value.Count) : 0;
            var minLatestDateTicks = locationUsage.Count > 0 ? locationUsage.Min(kv => kv.Value.LatestDate.Ticks) : 0L;
            var maxLatestDateTicks = locationUsage.Count > 0 ? locationUsage.Max(kv => kv.Value.LatestDate.Ticks) : 0L;
            var latestDateTicksRange = maxLatestDateTicks - minLatestDateTicks;

            var sortedLocations = locations
                .OrderByDescending(loc =>
                {
                    if (!locationUsage.ContainsKey(loc.Id))
                    {
                        return 0d;
                    }

                    var usage = locationUsage[loc.Id];
                    var normalizedCount = maxUsageCount > 0 ? (double)usage.Count / maxUsageCount : 0d;
                    var normalizedRecency = latestDateTicksRange > 0
                        ? (double)(usage.LatestDate.Ticks - minLatestDateTicks) / latestDateTicksRange
                        : 0d;

                    return (normalizedCount * 0.25d) + (normalizedRecency * 0.75d);
                })
                .ThenByDescending(loc => loc.Id);

            var results = sortedLocations.Select(location => MapLocationDto(location, locationUsage.ContainsKey(location.Id)
                ? locationUsage[location.Id].Count
                : 0));
            return Ok(results);
        }

        // GET: api/Locations/5
        [HttpGet("{id}", Name = "GetOneLocation")]
        public IActionResult Get(int id)
        {
            var userId = _currentUserService.GetRequiredUserId();
            var location = _locationsRepository.GetLocation(id, userId);

            if (location == null)
            {
                return NotFound();
            }

            var locationDto = MapLocationDto(location, _obsSessionsRepository.GetNumObsSessionsForLocation(userId, id));

            return Ok(locationDto);
        }
        
        // POST: api/Locations
        [HttpPost]
        public IActionResult Post([FromBody]LocationDtoForCreation locationDto)
        {
            var userId = _currentUserService.GetRequiredUserId();
            Location locationEntity = _mapper.Map<Location>(locationDto);

            Location addedLocation = _locationsRepository.AddLocation(locationEntity, userId);

            if (addedLocation == null)
            {
                return StatusCode(500, "Something went wrong creating a location");
            }

            LocationDto addedLocationDto = MapLocationDto(addedLocation, 0);
            return CreatedAtRoute("GetOneLocation", new { id = addedLocationDto.Id }, addedLocationDto);
        }
        
        // PUT: api/Locations/5
        [HttpPut("{id}")]
        public IActionResult Put(int id, [FromBody] LocationDtoForUpdate locationDto)
        {
            var userId = _currentUserService.GetRequiredUserId();
            if (locationDto == null)
            {
                return BadRequest();
            }

            if (string.IsNullOrEmpty(locationDto.Name) && string.IsNullOrEmpty(locationDto.Longitude)
                && string.IsNullOrEmpty(locationDto.Latitude) && string.IsNullOrEmpty(locationDto.GoogleMapsAddress))
            {
                return StatusCode(500, "Must provide some data");
            }

            Location locationEntity = _locationsRepository.GetLocation(id, userId);
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

            LocationDto locationDtoUpdated = MapLocationDto(locationEntity, _obsSessionsRepository.GetNumObsSessionsForLocation(userId, id));
            return Ok(locationDtoUpdated);
        }

        // DELETE: api/ApiWithActions/5
        [HttpDelete("{id}")]
        public IActionResult Delete(int id)
        {
            var userId = _currentUserService.GetRequiredUserId();
            Location locationEntity = _locationsRepository.GetLocation(id, userId);
            if (locationEntity == null)
            {
                return NotFound();
            }

            int numObsSessionReferences = _obsSessionsRepository.GetNumObsSessionsForLocation(userId, id);
            if (numObsSessionReferences > 0)
            {
                return BadRequest(FormatLocationDeleteReferenceMessage(numObsSessionReferences));
            }

            bool result = _locationsRepository.DeleteLocation(locationEntity);
            if (!result)
            {
                return StatusCode(500, "Something went wrong deleting the location");
            }

            return Ok();
        }

        // Adds the calculated session-reference count to the normal AutoMapper location DTO.
        private LocationDto MapLocationDto(Location location, int numReferences)
        {
            var locationDto = _mapper.Map<LocationDto>(location);
            locationDto.NumReferences = numReferences;
            return locationDto;
        }

        // Builds the delete-blocking message with singular/plural wording for the session count.
        private static string FormatLocationDeleteReferenceMessage(int numReferences)
        {
            if (numReferences == 1)
            {
                return "There is 1 observation session referring to this location. Can not delete.";
            }

            return $"There are {numReferences} observation sessions referring to this location. Can not delete.";
        }
    }
}
