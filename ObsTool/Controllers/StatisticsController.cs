using System;
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
    [Route("api/statistics")]
    public class StatisticsController : Controller
    {
        private IObsSessionsRepository _obsSessionsRepository;
        private ILocationsRepository _locationsRepository;
        private DsoRepo _dsoRepo;
        private ObservationsRepo _observationsRepo;

        public StatisticsController(MainDbContext mainDbContext, IObsSessionsRepository obsSessionRepository, ILocationsRepository locationsRepository, DsoRepo dsoRepo, ObservationsRepo observationsRepo)
        {
            _obsSessionsRepository = obsSessionRepository;
            _locationsRepository = locationsRepository;
            _dsoRepo = dsoRepo;
            _observationsRepo = observationsRepo;
        }

        [HttpGet()]
        public IActionResult Get()
        {
            StatisticsDto statsDto = new StatisticsDto {
                NumObsSessions = _obsSessionsRepository.GetNumObsSessions(),
                NumObservations = _observationsRepo.GetNumObservations(),
                NumObservedObjects = _observationsRepo.GetNumObservedObjects(),
                NumLocations = _locationsRepository.GetNumLocations(),
                NumDsoInDatabase = _dsoRepo.GetNumDsoInDatabase()
            };

            return Ok(statsDto);
        }

    }
}
