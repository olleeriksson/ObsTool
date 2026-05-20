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
    [Route("api/Eyepieces")]
    public class EyepiecesController : Controller
    {
        private EyepiecesRepo _eyepiecesRepo;
        private readonly IMapper _mapper;

        public EyepiecesController(EyepiecesRepo eyepiecesRepo, IMapper mapper)
        {
            _eyepiecesRepo = eyepiecesRepo;
            _mapper = mapper;
        }

        // GET: api/Eyepieces
        [HttpGet]
        public IActionResult Get()
        {
            var eyepieces = _eyepiecesRepo.GetEyepieces();
            var sorted = eyepieces.OrderByDescending(e => e.Id);
            var results = _mapper.Map<IEnumerable<EyepieceDto>>(sorted);
            return Ok(results);
        }

        // GET: api/Eyepieces/5
        [HttpGet("{id}", Name = "GetOneEyepiece")]
        public IActionResult Get(int id)
        {
            var eyepiece = _eyepiecesRepo.GetEyepiece(id);
            if (eyepiece == null)
            {
                return NotFound();
            }
            return Ok(_mapper.Map<EyepieceDto>(eyepiece));
        }

        // POST: api/Eyepieces
        [HttpPost]
        public IActionResult Post([FromBody] EyepieceDtoForCreation eyepieceDto)
        {
            if (eyepieceDto == null)
            {
                return BadRequest();
            }

            eyepieceDto.Name = string.IsNullOrWhiteSpace(eyepieceDto.Name) ? eyepieceDto.Key : eyepieceDto.Name;
            eyepieceDto.FocalLengthMm = NormalizeOptionalText(eyepieceDto.FocalLengthMm);
            var entity = _mapper.Map<Eyepiece>(eyepieceDto);
            var added = _eyepiecesRepo.AddEyepiece(entity);
            if (added == null)
            {
                return StatusCode(500, "Something went wrong creating an eyepiece");
            }
            var addedDto = _mapper.Map<EyepieceDto>(added);
            return CreatedAtRoute("GetOneEyepiece", new { id = addedDto.Id }, addedDto);
        }

        // DELETE: api/Eyepieces/5
        [HttpDelete("{id}")]
        public IActionResult Delete(int id)
        {
            var entity = _eyepiecesRepo.GetEyepiece(id);
            if (entity == null)
            {
                return NotFound();
            }

            if (!_eyepiecesRepo.DeleteEyepiece(entity))
            {
                return StatusCode(500, "Something went wrong deleting the eyepiece");
            }

            return Ok();
        }

        // PUT: api/Eyepieces/5
        [HttpPut("{id}")]
        public IActionResult Put(int id, [FromBody] EyepieceDtoForUpdate eyepieceDto)
        {
            if (eyepieceDto == null)
            {
                return BadRequest();
            }

            var entity = _eyepiecesRepo.GetEyepiece(id);
            if (entity == null)
            {
                return NotFound();
            }

            _mapper.Map(eyepieceDto, entity);
            entity.Name = string.IsNullOrWhiteSpace(entity.Name) ? entity.Key : entity.Name;
            entity.FocalLengthMm = NormalizeOptionalText(entity.FocalLengthMm);

            if (!_eyepiecesRepo.SaveChanges())
            {
                return StatusCode(500, "Something went wrong updating the eyepiece");
            }

            return Ok(_mapper.Map<EyepieceDto>(entity));
        }

        private static string NormalizeOptionalText(string value)
        {
            return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
        }
    }
}
