using ObsTool.Entities;
using ObsTool.Models;
using AutoMapper;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ObsTool.Services
{
    public class ObservationsService
    {
        private ObservationsRepo _observationsRepo;
        private IObsSessionsRepository _obsSessionsRepository;
        private MainDbContext _dbContext;

        public ObservationsService(ObservationsRepo observationsRepo, IObsSessionsRepository obsSessionsRepository, MainDbContext dbContext)
        {
            _observationsRepo = observationsRepo;
            _obsSessionsRepository = obsSessionsRepository;
            _dbContext = dbContext;
        }

        /// <summary>
        /// Passing in a list of DSO ids this method returns all observations of those DSO's, mapped by the observation id
        /// in which they were observed.
        /// </summary>
        public Dictionary<int, ICollection<ObservationDto>> GetAllObservationDtosMappedByDsoIdForMultipleDsoIds(int[] dsoIds, int[] exludeObservationIds = null)
        {
            int[] exludeObservationIdList = exludeObservationIds != null ? exludeObservationIds : new int[] { };

            // Get the corresponding ObservationDto's
            var allObservations = GetAllObservationDtosForMultipleDsoIds(dsoIds);

            // Put them in a dictionary of arrays for faster lookup, mapped by the observation id
            var mapOfOtherObservations = new Dictionary<int, ICollection<ObservationDto>>();
            foreach (var observationDto in allObservations)
            {
                // If the object is in the list of excluded obs ids, then it's not an "other" observation
                if (exludeObservationIdList.Contains(observationDto.Id))
                {
                    continue;
                }

                // OLLE
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

        public IEnumerable<ObservationDto> GetAllObservationDtosForMultipleDsoIds(ICollection<int> dsoIds)
        {
            // Get all observations every done on the provided list of DSOs
            ICollection<Observation> observations = _observationsRepo.GetObservationsByMultipleDsoIds(dsoIds);

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
            var obsSessionDtos = Mapper.Map<IEnumerable<ObsSessionDto>>(obsSessions);
            foreach (var obsSessionDto in obsSessionDtos)
            {
                obsSessionDto.Observations = null;
                obsSessionDto.ReportText = null;
                obsSessionDto.Location = null;
            }

            // Put the newly stripped ObsSessionDto's in a lookup map
            var lookupMap = new Dictionary<int, ObsSessionDto>();
            foreach (var obsSessionDto in obsSessionDtos)
            {
                lookupMap.Add(obsSessionDto.Id, obsSessionDto);
            }

            // Convert the Observation's to DTO's
            IEnumerable<ObservationDto> observationDtos = Mapper.Map<IEnumerable<ObservationDto>>(observations);

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
