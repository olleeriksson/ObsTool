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
        private readonly IMapper _mapper;

        public DsoController(IDsoRepo dsoRepo, IH2500Repo h2500Repo, ObservationsService observationsService, IMapper mapper)
        {
            _dsoRepo = dsoRepo;
            _h2500Repo = h2500Repo;
            _observationsService = observationsService;
            _mapper = mapper;
        }

        [HttpGet("observed")]
        public IActionResult GetAllObservedDso(bool includeHerschel = false)
        {
            // Get all observations in the whole database, mapped by DSO id
            var observationsMapByDsoId = _observationsService.GetAllObservationDtosMappedByDsoIdForMultipleDsoIds();

            // Secondly, get the DSOs
            var dsoIds = observationsMapByDsoId.Keys.ToList();
            ICollection<Dso> dsoList = _dsoRepo.GetMultipleDsoByIds(dsoIds);

            int maxCount = 2000;
            var truncatedDsoList = dsoList.Take(maxCount);
            IEnumerable<DsoDto> truncatedDsoDtoList = _mapper.Map<IEnumerable<DsoDto>>(truncatedDsoList);
            if (includeHerschel)
            {
                PopulateHerschelBadges(truncatedDsoDtoList);
            }

            foreach (DsoDto dso in truncatedDsoDtoList)
            {
                if (observationsMapByDsoId.ContainsKey(dso.Id))
                {
                    var observations = observationsMapByDsoId[dso.Id];

                    // Order observations by date
                    var sortedObservations = observations.OrderByDescending(o => DateTime.Parse(o.ObsSession.Date));

                    dso.NumObservations = observations.Count;
                    dso.Observations = sortedObservations.ToArray();
                }
            }

            // Order DSOs by number of observations
            var orderedDsoList = truncatedDsoDtoList.OrderByDescending(d => d.NumObservations);

            PagedResultDto<DsoDto> pagedResult = new PagedResultDto<DsoDto>();
            int count = dsoList.Count;
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
                dsoList = _dsoRepo.GetMultipleDsoByQueryString(query);

                int maxCount = 15;
                var truncatedDsoList = dsoList.Take(maxCount);
                IEnumerable<DsoDto> truncatedDsoDtoList = _mapper.Map<IEnumerable<DsoDto>>(truncatedDsoList);
                if (includeHerschel)
                {
                    PopulateHerschelBadges(truncatedDsoDtoList);
                }

                var dsoIds = truncatedDsoDtoList.Select(dso => dso.Id).ToList<int>();

                bool includePrevAndNextObservations = true;  // This is the only place where we pass true to include prev and next observations
                var observationsMapByDsoId = _observationsService.GetAllObservationDtosMappedByDsoIdForMultipleDsoIds(dsoIds, null, includePrevAndNextObservations);
                
                foreach (DsoDto dso in truncatedDsoDtoList)
                {
                    if (observationsMapByDsoId.ContainsKey(dso.Id))
                    {
                        var observations = observationsMapByDsoId[dso.Id];
                        dso.NumObservations = observations.Count;
                        dso.Observations = observations.ToArray();
                    }
                }

                PagedResultDto<DsoDto> pagedResult = new PagedResultDto<DsoDto>();
                int count = dsoList.Count;
                pagedResult.Count = count > maxCount ? maxCount : count;
                pagedResult.Total = count;
                pagedResult.More = count > maxCount ? count - maxCount : 0;
                pagedResult.Data = truncatedDsoDtoList.ToArray();

                return Ok(pagedResult);
            }
            else  // "Getting" one
            {
                Dso dso = _dsoRepo.GetDsoByName(name);
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
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            Dso dso = _dsoRepo.GetDsoById(id);
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
            var dsoList = dsoDtos.ToList();
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
