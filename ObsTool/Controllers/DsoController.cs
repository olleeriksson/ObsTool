using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ObsTool.Entities;
using ObsTool.Services;
using ObsTool.Models;
using AutoMapper;
using Microsoft.AspNetCore.Authorization;

namespace ObsTool
{
    [Produces("application/json")]
    [Route("api/dso")]
    public class DsoController : Controller
    {
        private IDsoRepo _dsoRepo;
        private IH2500Repo _h2500Repo;
        private ObservationsService _observationsService;
        private ObjectsRepo _objectsRepo;
        private readonly CurrentUserService _currentUserService;
        private readonly IMapper _mapper;

        public DsoController(IDsoRepo dsoRepo, IH2500Repo h2500Repo, ObservationsService observationsService,
            ObjectsRepo objectsRepo, CurrentUserService currentUserService, IMapper mapper)
        {
            _dsoRepo = dsoRepo;
            _h2500Repo = h2500Repo;
            _observationsService = observationsService;
            _objectsRepo = objectsRepo;
            _currentUserService = currentUserService;
            _mapper = mapper;
        }

        [HttpGet("observed")]
        public IActionResult GetAllObservedDso(bool includeHerschel = false)
        {
            var userId = _currentUserService.GetRequiredUserId();
            var observationsMapByObjectKey = _observationsService.GetAllObservationDtosMappedByObjectKey(userId, null);

            int maxCount = 2000;
            var observedObjects = GetObjectDtosByKeys(userId, observationsMapByObjectKey.Keys).ToList();
            var truncatedDsoDtoList = observedObjects.Take(maxCount).ToList();
            if (includeHerschel)
            {
                PopulateHerschelBadges(truncatedDsoDtoList);
            }

            AttachObservationsByObjectKey(truncatedDsoDtoList, observationsMapByObjectKey, orderByDate: true);

            // Order DSOs by number of observations
            var orderedDsoList = truncatedDsoDtoList.OrderByDescending(d => d.NumObservations);

            PagedResultDto<DsoDto> pagedResult = new PagedResultDto<DsoDto>();
            int count = observedObjects.Count;
            pagedResult.Count = count > maxCount ? maxCount : count;
            pagedResult.Total = count;
            pagedResult.More = count > maxCount ? count - maxCount : 0;
            pagedResult.Data = orderedDsoList.ToArray();

            return Ok(pagedResult);
        }

        /// <summary>
        /// Used both by the page listing all observations, and all the search pages/components.
        /// </summary>
        [HttpGet()]
        public IActionResult GetDso([FromQuery] string query, [FromQuery] string name, [FromQuery] bool includeHerschel = false)
        {
            var userId = _currentUserService.GetRequiredUserId();
            if ((name != null && query != null) || (name == null && query == null))
            {
                return BadRequest("Can't specify neither or both of 'name' and 'query'. Specify one or the other!");
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            ICollection<Dso> dsoList;
            if (query != null)  // Searching
            {
                dsoList = _dsoRepo.GetMultipleDsoByQueryString(query, normalize: true, userId: userId);

                int maxCount = 15;
                var userObjectDtos = _objectsRepo.GetUserObjectsByQueryString(query, userId).Select(DsoDto.FromUserObject);
                var dsoDtos = _mapper.Map<IEnumerable<DsoDto>>(dsoList);
                var otherObjectDtos = _objectsRepo.GetOtherObjectsByQueryString(query).Select(DsoDto.FromOtherObject);
                var matchingObjectDtos = userObjectDtos
                    .Concat(dsoDtos)
                    .Concat(otherObjectDtos)
                    .ToList();
                var truncatedDsoDtoList = matchingObjectDtos.Take(maxCount).ToList();
                if (includeHerschel)
                {
                    PopulateHerschelBadges(truncatedDsoDtoList);
                }

                bool includePrevAndNextObservations = true;  // This is the only place where we pass true to include prev and next observations
                var objectKeys = truncatedDsoDtoList.Select(dso => dso.ObjectKey);
                var observationsMapByObjectKey = _observationsService.GetAllObservationDtosMappedByObjectKey(
                    userId, objectKeys, null, includePrevAndNextObservations);
                AttachObservationsByObjectKey(truncatedDsoDtoList, observationsMapByObjectKey, orderByDate: false);

                PagedResultDto<DsoDto> pagedResult = new PagedResultDto<DsoDto>();
                int count = matchingObjectDtos.Count;
                pagedResult.Count = count > maxCount ? maxCount : count;
                pagedResult.Total = count;
                pagedResult.More = count > maxCount ? count - maxCount : 0;
                pagedResult.Data = truncatedDsoDtoList.ToArray();

                return Ok(pagedResult);
            }
            else  // "Getting" one
            {
                Dso dso = _dsoRepo.GetDsoByName(name, normalize: true, userId: userId);
                if (dso == null)
                {
                    return NotFound();
                }

                dsoList = new List<Dso>();
                dsoList.Add(dso);

                IEnumerable<DsoDto> result = _mapper.Map<IEnumerable<DsoDto>>(dsoList);
                if (includeHerschel)
                {
                    PopulateHerschelBadges(result);
                }
                return Ok(result);
            }
        }

        [HttpGet("{id}")]
        public IActionResult GetDso([FromRoute] int id, [FromQuery] bool includeHerschel = false)
        {
            var userId = _currentUserService.GetRequiredUserId();
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            Dso dso = _dsoRepo.GetDsoById(id, userId);
            if (dso == null)
            {
                return NotFound();
            }

            DsoDto result = _mapper.Map<DsoDto>(dso);

            if (includeHerschel)
            {
                PopulateHerschelBadges(new[] { result });
            }

            return Ok(result);
        }

        [HttpGet("{id}/herschel")]
        public IActionResult GetHerschelDetails([FromRoute] int id)
        {
            if (_dsoRepo.GetDsoById(id) == null)
            {
                return NotFound();
            }

            var details = _h2500Repo.GetH2500ObjectsByDsoId(id)
                .Select(h => new HerschelDetailsDto
                {
                    HerschelId = h.HerschelId,
                    HerschelNo = h.HerschelNo,
                    H400 = h.H400,
                    DescrLong = h.DescrLong,
                    HerschelSummary = HerschelSummaryExtractor.ExtractWilliamHerschelBlock(h.DescrLong)
                })
                .ToArray();

            return Ok(details);
        }

        private void PopulateHerschelBadges(IEnumerable<DsoDto> dsoDtos)
        {
            var dsoList = dsoDtos
                .Where(dso => dso.ObjectKind == ObservedObjectKind.Sac)
                .ToList();
            var herschelByDsoId = _h2500Repo.GetH2500ObjectsByDsoIds(dsoList.Select(d => d.Id))
                .Where(h => h.SacDeepSkyObjectsId != null)
                .GroupBy(h => h.SacDeepSkyObjectsId.Value)
                .ToDictionary(g => g.Key, g => g.Select(ToHerschelInfoDto).ToArray());

            foreach (DsoDto dso in dsoList)
            {
                if (herschelByDsoId.ContainsKey(dso.Id))
                {
                    dso.HerschelObjects = herschelByDsoId[dso.Id];
                }
            }
        }

        /// <summary>
        /// Loads SAC, User, and Other object DTOs for the object keys found in observations.
        /// </summary>
        private IEnumerable<DsoDto> GetObjectDtosByKeys(int userId, IEnumerable<string> objectKeys)
        {
            var objectKeySet = new HashSet<string>(objectKeys.Where(key => !string.IsNullOrWhiteSpace(key)));
            var dsoIds = GetObjectIds(objectKeySet, ObservedObjectKind.Sac);
            var otherObjectIds = GetObjectIds(objectKeySet, ObservedObjectKind.Other);
            var userObjectIds = GetObjectIds(objectKeySet, ObservedObjectKind.User);

            var dsoDtos = _mapper.Map<IEnumerable<DsoDto>>(_dsoRepo.GetMultipleDsoByIds(dsoIds, userId));
            var userObjectDtos = _objectsRepo.GetUserObjects(userId)
                .Where(userObject => userObjectIds.Contains(userObject.Id))
                .Select(DsoDto.FromUserObject);
            var otherObjectDtos = _objectsRepo.GetOtherObjects()
                .Where(otherObject => otherObjectIds.Contains(otherObject.Id))
                .Select(DsoDto.FromOtherObject);

            return dsoDtos.Concat(userObjectDtos).Concat(otherObjectDtos);
        }

        /// <summary>
        /// Extracts typed integer ids from object keys like Sac:1, Other:2, and User:3.
        /// </summary>
        private static List<int> GetObjectIds(IEnumerable<string> objectKeys, string objectKind)
        {
            string keyPrefix = objectKind + ":";
            return objectKeys
                .Where(key => key.StartsWith(keyPrefix, StringComparison.Ordinal))
                .Select(key => key.Substring(keyPrefix.Length))
                .Where(idPart => int.TryParse(idPart, out _))
                .Select(int.Parse)
                .ToList();
        }

        /// <summary>
        /// Attaches observation lists to mixed object DTOs using object keys instead of table-local ids.
        /// </summary>
        private static void AttachObservationsByObjectKey(
            IEnumerable<DsoDto> objectDtos,
            IReadOnlyDictionary<string, ICollection<ObservationDto>> observationsMapByObjectKey,
            bool orderByDate)
        {
            foreach (DsoDto objectDto in objectDtos)
            {
                if (string.IsNullOrWhiteSpace(objectDto.ObjectKey) || !observationsMapByObjectKey.ContainsKey(objectDto.ObjectKey))
                {
                    continue;
                }

                var observations = observationsMapByObjectKey[objectDto.ObjectKey];
                objectDto.NumObservations = observations.Count;
                objectDto.Observations = orderByDate
                    ? observations.OrderByDescending(o => DateTime.Parse(o.ObsSession.Date)).ToArray()
                    : observations.ToArray();
            }
        }

        private static HerschelInfoDto ToHerschelInfoDto(H2500 herschelObject)
        {
            return new HerschelInfoDto
            {
                HerschelId = herschelObject.HerschelId,
                HerschelNo = herschelObject.HerschelNo,
                H400 = herschelObject.H400
            };
        }

        //// GET: api/dso/5
        //[HttpGet("{id}")]
        //public async Task<IActionResult> GetDso([FromRoute] int id)
        //{
        //    if (!ModelState.IsValid)
        //    {
        //        return BadRequest(ModelState);
        //    }

        //    var dso = await _context.Dso.SingleOrDefaultAsync(m => m.Id == id);

        //    if (dso == null)
        //    {
        //        return NotFound();
        //    }

        //    return Ok(dso);
        //}


        //private bool DsoExists(int id)
        //{
        //    return _dsoRepo.GetDsoById(id) != null;
        //}
    }
}
