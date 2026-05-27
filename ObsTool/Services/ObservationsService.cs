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
        public Dictionary<int, ICollection<ObservationDto>> GetAllObservationDtosMappedByDsoIdForMultipleDsoIds(int userId, List<int> dsoIds = null,
            int[] exludeObservationIds = null, bool includePrevAndNextObservations = false)
        {
            int[] exludeObservationIdList = exludeObservationIds ?? (new int[] { });

            // Get the corresponding ObservationDto's
            IEnumerable<ObservationDto> observations;
            if (dsoIds == null)
            {
                observations = GetAllObservationDtosEverMade(userId);  // we really should pass includePrevAndNextObservations to make this generic but it's not used here so..
            }
            else
            {
                observations = GetAllObservationDtosForMultipleDsoIds(dsoIds, userId, includePrevAndNextObservations);
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
                    if (!dsoObservation.DsoId.HasValue)
                    {
                        continue;
                    }

                    int dsoId = dsoObservation.DsoId.Value;

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

        /// <summary>
        /// Maps observations by polymorphic object key so SAC, Other, and User objects can reuse the same lookup path.
        /// </summary>
        public Dictionary<string, ICollection<ObservationDto>> GetAllObservationDtosMappedByObjectKey(
            int userId,
            IEnumerable<string> objectKeys,
            int[] exludeObservationIds = null,
            bool includePrevAndNextObservations = false)
        {
            var objectKeySet = objectKeys == null
                ? null
                : new HashSet<string>(objectKeys.Where(key => !string.IsNullOrWhiteSpace(key)));
            int[] exludeObservationIdList = exludeObservationIds ?? (new int[] { });
            var observations = GetAllObservationsWithExtra(
                _observationsRepo.GetAllObservations(userId),
                userId,
                includePrevAndNextObservations);
            var mapOfOtherObservations = new Dictionary<string, ICollection<ObservationDto>>();

            foreach (var observationDto in observations)
            {
                if (exludeObservationIdList.Contains(observationDto.Id))
                {
                    continue;
                }

                foreach (var dsoObservation in observationDto.DsoObservations)
                {
                    string objectKey = dsoObservation.ObjectKey;
                    if (string.IsNullOrWhiteSpace(objectKey) || (objectKeySet != null && !objectKeySet.Contains(objectKey)))
                    {
                        continue;
                    }

                    if (!mapOfOtherObservations.ContainsKey(objectKey))
                    {
                        mapOfOtherObservations.Add(objectKey, new List<ObservationDto>());
                    }

                    mapOfOtherObservations[objectKey].Add(observationDto);
                }
            }

            return mapOfOtherObservations;
        }

        public IEnumerable<ObservationDto> GetAllObservationDtosEverMade(int userId)
        {
            // Get all the observations ever made, hardly a useful page
            ICollection<Observation> observations = _observationsRepo.GetAllObservations(userId);

            return GetAllObservationsWithExtra(observations, userId, false);
        }

        public IEnumerable<ObservationDto> GetAllObservationDtosForMultipleDsoIds(List<int> dsoIds, int userId, bool includePrevAndNextObservations = false)
        {
            // Get all observations every done on the provided list of DSOs
            ICollection<Observation> observations = _observationsRepo.GetObservationsByMultipleDsoIds(dsoIds, userId);

            return GetAllObservationsWithExtra(observations, userId, includePrevAndNextObservations);
        }

        private IEnumerable<ObservationDto> GetAllObservationsWithExtra(ICollection<Observation> observations, int userId, bool includePrevAndNextObservations)
        {
            // Convert the Observations to DTO's
            var observationDtos = _mapper.Map<IEnumerable<ObservationDto>>(observations);

            Dictionary<int, ObsSessionDto> obsSessionLookupMap = GetObsSessionsForObservations(observations, userId);

            // Then manually set the ObsSessionDto's on the ObservationDto's because automapper can't handle it
            // (it creates a self referencing loop). 
            foreach (var observationDto in observationDtos)
            {
                ObsSessionDto obsSessionDto = obsSessionLookupMap[observationDto.ObsSessionId];

                // Add obs session just so the frontend can retrieve the title for the session, a little overkill with a whole ObsSession (not fully populated though)
                observationDto.ObsSession = obsSessionDto;

                // Add prev and next observations
                if (includePrevAndNextObservations) {
                    GetPrevAndNextObservationsForObservationDtos(observationDto, obsSessionDto, out ObservationDto prevObservationDto, out ObservationDto nextObservationDto);
                    observationDto.PrevObservation = prevObservationDto;
                    observationDto.NextObservation = nextObservationDto;
                }
            }

            return observationDtos;
        }

        private void GetPrevAndNextObservationsForObservationDtos(ObservationDto observationDto, ObsSessionDto obsSessionDto, out ObservationDto prevObservationDto, out ObservationDto nextObservationDto)
        {
            prevObservationDto = null;
            nextObservationDto = null;
            if (!observationDto.DisplayOrder.HasValue) {
                return;
            }
            var currentDisplayPos = observationDto.DisplayOrder;

            prevObservationDto = obsSessionDto.Observations.FirstOrDefault(o => o.DisplayOrder == currentDisplayPos - 1);
            nextObservationDto = obsSessionDto.Observations.FirstOrDefault(o => o.DisplayOrder == currentDisplayPos + 1);
        }

        /// <summary>
        /// Returns a lookupmap to be able to find the ObsSessionDto for a given observation.
        /// </summary>
        private Dictionary<int, ObsSessionDto> GetObsSessionsForObservations(ICollection<Observation> observations, int userId)
        {
            var obsSessionIds = GetUniqueObsSessionIds(observations);

            var obsSessions = _obsSessionsRepository.GetObsSessionsByMultipleIds(obsSessionIds, userId, includeObservations: true);

            // Convert them to DTOs and then strip them of some fields we don't want
            var obsSessionDtos = _mapper.Map<IEnumerable<ObsSessionDto>>(obsSessions);
            foreach (var obsSessionDto in obsSessionDtos)
            {
                //obsSessionDto.Observations = null;
                obsSessionDto.ReportText = null;
            }

            // Put the newly stripped ObsSessionDto's in a lookup map
            var lookupMap = new Dictionary<int, ObsSessionDto>();
            foreach (var obsSessionDto in obsSessionDtos)
            {
                lookupMap.Add(obsSessionDto.Id, obsSessionDto);
            }
            return lookupMap;
        }

        private List<int> GetUniqueObsSessionIds(ICollection<Observation> observations)
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

            return obsSessionIds;
        }
    }
}
