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
            var observationReferenceCounts = _instrumentsRepo.GetObservationReferenceCounts(userId);
            var obsSessionReferenceCounts = _instrumentsRepo.GetObsSessionReferenceCounts(userId);
            var sorted = instruments.OrderByDescending(i => i.Id);
            var results = sorted.Select(instrument => MapInstrumentDto(
                instrument,
                observationReferenceCounts.ContainsKey(instrument.Id) ? observationReferenceCounts[instrument.Id] : 0,
                obsSessionReferenceCounts.ContainsKey(instrument.Id) ? obsSessionReferenceCounts[instrument.Id] : 0));
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
            return Ok(MapInstrumentDto(
                instrument,
                _instrumentsRepo.GetNumObservationsForInstrument(id, userId),
                _instrumentsRepo.GetNumObsSessionsForInstrument(id, userId)));
        }

        // POST: api/Instruments
        [HttpPost]
        public IActionResult Post([FromBody] InstrumentDtoForCreation instrumentDto)
        {
            var userId = _currentUserService.GetRequiredUserId();
            var entity = _mapper.Map<Instrument>(instrumentDto);
            NormalizeNullableKey(entity);
            var added = _instrumentsRepo.AddInstrument(entity, userId);
            if (added == null)
            {
                return StatusCode(500, "Something went wrong creating an instrument");
            }
            var addedDto = MapInstrumentDto(added, 0, 0);
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

            int numObservationReferences = _instrumentsRepo.GetNumObservationsForInstrument(id, userId);
            if (numObservationReferences > 0)
            {
                return BadRequest(FormatInstrumentDeleteReferenceMessage(numObservationReferences));
            }
            int numObsSessionReferences = _instrumentsRepo.GetNumObsSessionsForInstrument(id, userId);
            if (numObsSessionReferences > 0)
            {
                return BadRequest(FormatInstrumentObsSessionDeleteReferenceMessage(numObsSessionReferences));
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
            NormalizeNullableKey(entity);

            if (!_instrumentsRepo.SaveChanges())
            {
                return StatusCode(500, "Something went wrong updating the instrument");
            }

            return Ok(MapInstrumentDto(
                entity,
                _instrumentsRepo.GetNumObservationsForInstrument(id, userId),
                _instrumentsRepo.GetNumObsSessionsForInstrument(id, userId)));
        }

        /// <summary>
        /// Adds calculated reference counts to the normal AutoMapper instrument DTO.
        /// </summary>
        private InstrumentDto MapInstrumentDto(Instrument instrument, int numObservationReferences, int numObsSessionReferences)
        {
            var instrumentDto = _mapper.Map<InstrumentDto>(instrument);
            instrumentDto.NumObservationReferences = numObservationReferences;
            instrumentDto.NumObsSessionReferences = numObsSessionReferences;
            instrumentDto.NumReferences = numObservationReferences + numObsSessionReferences;
            return instrumentDto;
        }

        /// <summary>
        /// Builds the delete-blocking message with singular/plural wording for the observation count.
        /// </summary>
        private static string FormatInstrumentDeleteReferenceMessage(int numReferences)
        {
            if (numReferences == 1)
            {
                return "There is 1 observation referring to this instrument. Cannot delete.";
            }

            return $"There are {numReferences} observations referring to this instrument. Cannot delete.";
        }

        /// <summary>
        /// Builds the delete-blocking message with singular/plural wording for the observation-session count.
        /// </summary>
        private static string FormatInstrumentObsSessionDeleteReferenceMessage(int numReferences)
        {
            if (numReferences == 1)
            {
                return "There is 1 observation session referring to this instrument. Cannot delete.";
            }

            return $"There are {numReferences} observation sessions referring to this instrument. Cannot delete.";
        }

        /// <summary>
        /// Stores an omitted instrument parser key as null so the parser and UI can treat the instrument as session-only metadata.
        /// </summary>
        private static void NormalizeNullableKey(Instrument instrument)
        {
            instrument.Key = string.IsNullOrWhiteSpace(instrument.Key) ? null : instrument.Key.Trim();
        }
    }
}
