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
        private IInstrumentsRepo _instrumentsRepo;
        private readonly CurrentUserService _currentUserService;
        private readonly IMapper _mapper;

        public InstrumentsController(IInstrumentsRepo instrumentsRepo, CurrentUserService currentUserService, IMapper mapper)
        {
            _instrumentsRepo = instrumentsRepo;
            _currentUserService = currentUserService;
            _mapper = mapper;
        }

        // GET: api/Instruments
        [HttpGet]
        public IActionResult Get()
        {
            var userId = _currentUserService.GetRequiredUserId();
            var instruments = _instrumentsRepo.GetInstruments(userId);
            var sorted = instruments.OrderByDescending(i => i.Id);
            var results = _mapper.Map<IEnumerable<InstrumentDto>>(sorted);
            return Ok(results);
        }

        // GET: api/Instruments/5
        [HttpGet("{id}", Name = "GetOneInstrument")]
        public IActionResult Get(int id)
        {
            var userId = _currentUserService.GetRequiredUserId();
            var instrument = _instrumentsRepo.GetInstrument(id, userId);
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
            var userId = _currentUserService.GetRequiredUserId();
            var entity = _mapper.Map<Instrument>(instrumentDto);
            var added = _instrumentsRepo.AddInstrument(entity, userId);
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
            var userId = _currentUserService.GetRequiredUserId();
            var entity = _instrumentsRepo.GetInstrument(id, userId);
            if (entity == null)
            {
                return NotFound();
            }

            if (_instrumentsRepo.AnyObservationReferences(id, userId))
            {
                return BadRequest("There are observations referring to this instrument. Cannot delete.");
            }
            if (_instrumentsRepo.AnyObsSessionReferences(id, userId))
            {
                return BadRequest("There are observation sessions referring to this instrument. Cannot delete.");
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
            var userId = _currentUserService.GetRequiredUserId();
            if (instrumentDto == null)
            {
                return BadRequest();
            }

            var entity = _instrumentsRepo.GetInstrument(id, userId);
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
