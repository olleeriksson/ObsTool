using ObsTool.Entities;
using ObsTool.Models;
using AutoMapper;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ObsTool.Database;

namespace ObsTool.Services
{
    public class ObservationsService
    {
        private ObservationsRepo _observationsRepo;
        private ObsSessionsRepo _obsSessionsRepository;
        private MainDbContext _dbContext;
        private readonly IMapper _mapper;

        public ObservationsService(ObservationsRepo observationsRepo, ObsSessionsRepo obsSessionsRepository, MainDbContext dbContext, IMapper mapper)
        {
            _observationsRepo = observationsRepo;
            _obsSessionsRepository = obsSessionsRepository;
            _dbContext = dbContext;
            _mapper = mapper;
        }

        /// <summary>
        /// Passing in a list of DSO ids this method returns all observations of those DSO's, mapped by the observation id
        /// in which they were observed.
        /// </summary>
        public Dictionary<int, ICollection<ObservationDto>> GetAllObservationDtosMappedByDsoIdForMultipleDsoIds(List<int> dsoIds = null, int[] exludeObservationIds = null)
        {
            int[] exludeObservationIdList = exludeObservationIds ?? (new int[] { });

            // Get the corresponding ObservationDto's
            IEnumerable<ObservationDto> observations;
            if (dsoIds == null)
            {
                observations = GetAllObservationDtos();
            }
            else
            {
                observations = GetAllObservationDtosForMultipleDsoIds(dsoIds);
            }

            // Put them in a dictionary of arrays for faster lookup, mapped by the observation id
            var mapOfOtherObservations = new Dictionary<int, ICollection<ObservationDto>>();
            foreach (var observationDto in observations)
            {
                // If the object is in the list of excluded obs ids, then it's not an "other" observation
                if (exludeObservationIdList.Contains(observationDto.Id))
                {
                    continue;
                }

                foreach (var dsoObservation in observationDto.DsoObservations)
                {
                    int dsoId = dsoObservation.DsoId;

                    // For observations of a newly encountered DSO create a list for it in the map
                    if (!mapOfOtherObservations.ContainsKey(dsoId))
                    {
                        mapOfOtherObservations.Add(dsoId, new List<ObservationDto>());
                    }
                    mapOfOtherObservations[dsoId].Add(observationDto);
                }
            }

            return mapOfOtherObservations;
        }

        public IEnumerable<ObservationDto> GetAllObservationDtos()
        {
            // Get all observations every done on the provided list of DSOs
            ICollection<Observation> observations = _observationsRepo.GetAllObservations();

            return GetAllObservationDtosForObservations(observations);
        }

        public IEnumerable<ObservationDto> GetAllObservationDtosForMultipleDsoIds(List<int> dsoIds)
        {
            // Get all observations every done on the provided list of DSOs
            ICollection<Observation> observations = _observationsRepo.GetObservationsByMultipleDsoIds(dsoIds);

            return GetAllObservationDtosForObservations(observations);
        }

        public IEnumerable<ObservationDto> GetAllObservationDtosForObservations(ICollection<Observation> observations)
        {
            // Get all unique observation session ids from the observations
            // This should really not be necessary since you can't very well have an observation of the same DSO
            // several times in the same session, and really so what if it does.
            var set = new Dictionary<int, int>();
            foreach (Observation obs in observations)
            {
                _dbContext.Entry(obs).Collection("DsoObservations").Load();

                if (!set.ContainsKey(obs.ObsSessionId))
                {
                    set.Add(obs.ObsSessionId, obs.ObsSessionId);
                }
            }
            var obsSessionIds = set.Keys.ToList();

            // Get the ObsSessions for all the id's
            var obsSessions = _obsSessionsRepository.GetObsSessionsByMultipleIds(obsSessionIds);

            // Convert them to DTOs and then strip them of some fields we don't want
            var obsSessionDtos = _mapper.Map<IEnumerable<ObsSessionDto>>(obsSessions);
            foreach (var obsSessionDto in obsSessionDtos)
            {
                obsSessionDto.Observations = null;
                obsSessionDto.ReportText = null;
                //obsSessionDto.Location = null;
            }

            // Put the newly stripped ObsSessionDto's in a lookup map
            var lookupMap = new Dictionary<int, ObsSessionDto>();
            foreach (var obsSessionDto in obsSessionDtos)
            {
                lookupMap.Add(obsSessionDto.Id, obsSessionDto);
            }

            // Convert the Observation's to DTO's
            IEnumerable<ObservationDto> observationDtos = _mapper.Map<IEnumerable<ObservationDto>>(observations);

            // Then manually set the ObsSessionDto's on the ObservationDto's because automapper can't handle it
            // (it creates a self referencing loop). 
            foreach (var observationDto in observationDtos)
            {
                observationDto.ObsSession = lookupMap[observationDto.ObsSessionId];
            }

            return observationDtos;
        }
    }
}
