using System.Collections.Generic;
using System.Linq;
using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ObsTool.Entities;
using ObsTool.Models;
using ObsTool.Services;

namespace ObsTool.Controllers
{
    [Produces("application/json")]
    [Route("api/Instruments")]
    public class InstrumentsController : Controller
    {
        private InstrumentsRepo _instrumentsRepo;
        private readonly IMapper _mapper;

        public InstrumentsController(InstrumentsRepo instrumentsRepo, IMapper mapper)
        {
            _instrumentsRepo = instrumentsRepo;
            _mapper = mapper;
        }

        // GET: api/Instruments
        [AllowAnonymous]
        [HttpGet]
        public IActionResult Get()
        {
            var instruments = _instrumentsRepo.GetInstruments();
            var sorted = instruments.OrderByDescending(i => i.Id);
            var results = _mapper.Map<IEnumerable<InstrumentDto>>(sorted);
            return Ok(results);
        }

        // GET: api/Instruments/5
        [AllowAnonymous]
        [HttpGet("{id}", Name = "GetOneInstrument")]
        public IActionResult Get(int id)
        {
            var instrument = _instrumentsRepo.GetInstrument(id);
            if (instrument == null)
            {
                return NotFound();
            }
            return Ok(_mapper.Map<InstrumentDto>(instrument));
        }

        // POST: api/Instruments
        [HttpPost]
        public IActionResult Post([FromBody] InstrumentDtoForCreation instrumentDto)
        {
            var entity = _mapper.Map<Instrument>(instrumentDto);
            var added = _instrumentsRepo.AddInstrument(entity);
            if (added == null)
            {
                return StatusCode(500, "Something went wrong creating an instrument");
            }
            var addedDto = _mapper.Map<InstrumentDto>(added);
            return CreatedAtRoute("GetOneInstrument", new { id = addedDto.Id }, addedDto);
        }

        // DELETE: api/Instruments/5
        [HttpDelete("{id}")]
        public IActionResult Delete(int id)
        {
            var entity = _instrumentsRepo.GetInstrument(id);
            if (entity == null)
            {
                return NotFound();
            }

            if (_instrumentsRepo.AnyObservationReferences(id))
            {
                return BadRequest("There are observations referring to this instrument. Cannot delete.");
            }

            if (!_instrumentsRepo.DeleteInstrument(entity))
            {
                return StatusCode(500, "Something went wrong deleting the instrument");
            }

            return Ok();
        }

        // PUT: api/Instruments/5
        [HttpPut("{id}")]
        public IActionResult Put(int id, [FromBody] InstrumentDtoForUpdate instrumentDto)
        {
            if (instrumentDto == null)
            {
                return BadRequest();
            }

            var entity = _instrumentsRepo.GetInstrument(id);
            if (entity == null)
            {
                return NotFound();
            }

            _mapper.Map(instrumentDto, entity);

            if (!_instrumentsRepo.SaveChanges())
            {
                return StatusCode(500, "Something went wrong updating the instrument");
            }

            return Ok(_mapper.Map<InstrumentDto>(entity));
        }
    }
}
