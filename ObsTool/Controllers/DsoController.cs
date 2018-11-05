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

namespace ObsTool
{
    [Produces("application/json")]
    [Route("api/dso")]
    public class DsoController : Controller
    {
        private DsoRepo _dsoRepo;
        private ObservationsService _observationsService;

        public DsoController(DsoRepo dsoRepo, ObservationsService observationsService)
        {
            _dsoRepo = dsoRepo;
            _observationsService = observationsService;
        }

        [HttpGet()]
        public IActionResult GetDso([FromQuery] string query, [FromQuery] string name)
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
                IEnumerable<DsoDto> truncatedDsoDtoList = Mapper.Map<IEnumerable<DsoDto>>(truncatedDsoList);

                int[] dsoIds = truncatedDsoDtoList.Select(dso => dso.Id).ToArray();

                var observationsMapByDsoId = _observationsService.GetAllObservationDtosMappedByDsoIdForMultipleDsoIds(dsoIds);
                // OLLE

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

                IEnumerable<DsoDto> result = Mapper.Map<IEnumerable<DsoDto>>(dsoList);
                return Ok(result);
            }
        }

        [HttpGet("{id}")]
        public IActionResult GetDso([FromRoute] int id)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            Dso dso = _dsoRepo.GetDsoById(id);
            DsoDto result = Mapper.Map<DsoDto>(dso);

            if (dso == null)
            {
                return NotFound();
            }

            return Ok(result);
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


        private bool DsoExists(int id)
        {
            return _dsoRepo.GetDsoById(id) != null;
        }
    }

    internal class PagedResult<T>
    {
    }
}