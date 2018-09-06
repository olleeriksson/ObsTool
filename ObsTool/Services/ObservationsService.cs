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

        public ObservationsService(ObservationsRepo observationsRepo, IObsSessionsRepository obsSessionsRepository)
        {
            _observationsRepo = observationsRepo;
            _obsSessionsRepository = obsSessionsRepository;
        }

        public Dictionary<int, ICollection<ObservationDto>> GetAllObservationDtosForMultipleDsoIdsMappedByDsoId(int[] dsoIds, int[] exludeObservationIds = null)
        {
            int[] exludeObservationIdList = exludeObservationIds != null ? exludeObservationIds : new int[] { };

            // Get the corresponding ObservationDto's
            var allOtherObservations = GetAllObservationDtosForMultipleDsoIds(dsoIds);

            // Put them in a dictionary of arrays for faster lookup, mapped by the DSO id
            // -------------------------------------------------------------------------
            // TODO: It must be possible to do this much better in C# !!!!! Like in Java
            // -------------------------------------------------------------------------
            var mapOfOtherObservations = new Dictionary<int, ICollection<ObservationDto>>();
            foreach (var otherObservationDto in allOtherObservations)
            {
                int dsoId = otherObservationDto.DsoId;
                // For observations of a newly encountered DSO create a list for it in the map
                if (!mapOfOtherObservations.ContainsKey(dsoId))
                {
                    mapOfOtherObservations.Add(dsoId, new List<ObservationDto>());
                }
                // And add the observation to the list (except if it is one of the primary observations)
                // This is a list of the *other* observations after all.
                if (!exludeObservationIdList.Contains(otherObservationDto.Id))
                {
                    mapOfOtherObservations[dsoId].Add(otherObservationDto);
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
