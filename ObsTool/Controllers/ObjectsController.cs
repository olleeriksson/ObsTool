using System;
using System.Linq;
using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using ObsTool.Entities;
using ObsTool.Models;
using ObsTool.Services;

namespace ObsTool.Controllers
{
    [Produces("application/json")]
    [Route("api/objects")]
    public class ObjectsController : Controller
    {
        private readonly ObjectsRepo _objectsRepo;
        private readonly CurrentUserService _currentUserService;

        public ObjectsController(ObjectsRepo objectsRepo, CurrentUserService currentUserService)
        {
            _objectsRepo = objectsRepo;
            _currentUserService = currentUserService;
        }

        /// <summary>
        /// Returns editable user objects followed by readonly shared objects for the Objects page.
        /// </summary>
        [HttpGet]
        public IActionResult Get()
        {
            int? userId = _currentUserService.GetUserId();
            bool canCreateOtherObjects = CanCreateOtherObjects(userId);
            var userReferences = userId.HasValue
                ? _objectsRepo.GetUserObjectReferenceSummaries(userId.Value)
                : new System.Collections.Generic.Dictionary<int, ObjectReferenceSummary>();
            var otherReferences = userId.HasValue
                ? _objectsRepo.GetOtherObjectReferenceSummaries(userId.Value)
                : new System.Collections.Generic.Dictionary<int, ObjectReferenceSummary>();
            var otherObjects = _objectsRepo.GetOtherObjects().ToList();

            // The page intentionally groups editable user objects before readonly shared objects.
            return Ok(new ObjectListDto
            {
                UserObjects = userId.HasValue
                    ? _objectsRepo.GetUserObjects(userId.Value)
                    .Select(userObject => ObjectDto.FromUserObject(userObject, GetReferences(userReferences, userObject.Id)))
                    .ToList()
                    : Enumerable.Empty<ObjectDto>(),
                OtherObjects = otherObjects
                    .Select(otherObject => ObjectDto.FromOtherObject(
                        otherObject,
                        GetReferences(otherReferences, otherObject.Id),
                        canCreateOtherObjects,
                        canCreateOtherObjects && !_objectsRepo.AnyOtherObjectReferences(otherObject.Id)))
                    .ToList(),
                Constellations = _objectsRepo.GetConstellationOptions(),
                CanCreateOtherObjects = canCreateOtherObjects
            });
        }

        /// <summary>
        /// Returns one user object scoped to the authenticated owner.
        /// </summary>
        [HttpGet("user/{id}", Name = "GetOneUserObject")]
        public IActionResult GetUserObject(int id)
        {
            int userId = _currentUserService.GetRequiredUserId();
            var userObject = _objectsRepo.GetUserObject(id, userId);
            if (userObject == null)
            {
                return NotFound();
            }

            var references = _objectsRepo.GetUserObjectReferenceSummaries(userId);
            return Ok(ObjectDto.FromUserObject(userObject, GetReferences(references, userObject.Id)));
        }

        /// <summary>
        /// Creates a new user object; Name is required and becomes the parser-stable identifier.
        /// </summary>
        [HttpPost("user")]
        public IActionResult PostUserObject([FromBody] UserObjectDtoForCreation userObjectDto)
        {
            int userId = _currentUserService.GetRequiredUserId();
            if (userObjectDto == null)
            {
                return BadRequest();
            }

            var entity = new UserObject
            {
                Name = userObjectDto.Name,
                OtherNames = userObjectDto.OtherNames,
                CommonName = userObjectDto.CommonName,
                AllCommonNames = userObjectDto.AllCommonNames,
                Notes = userObjectDto.Notes,
                Type = userObjectDto.Type,
                Const = userObjectDto.Const,
                RA = userObjectDto.RA,
                DEC = userObjectDto.DEC,
                Mag = userObjectDto.Mag
            };

            var added = _objectsRepo.AddUserObject(entity, userId);
            var dto = ObjectDto.FromUserObject(added, new ObjectReferenceSummary());
            return CreatedAtRoute("GetOneUserObject", new { id = dto.Id }, dto);
        }

        /// <summary>
        /// Creates a readonly shared object when the current user is allowed to curate shared targets.
        /// </summary>
        [HttpPost("other")]
        public IActionResult PostOtherObject([FromBody] OtherObjectDtoForCreation otherObjectDto)
        {
            int? userId = _currentUserService.GetUserId();
            if (!CanCreateOtherObjects(userId))
            {
                return Forbid();
            }

            if (otherObjectDto == null)
            {
                return BadRequest();
            }

            var entity = new OtherObject
            {
                Name = otherObjectDto.Name,
                OtherNames = otherObjectDto.OtherNames,
                CommonName = otherObjectDto.CommonName,
                AllCommonNames = otherObjectDto.AllCommonNames,
                Notes = otherObjectDto.Notes,
                Type = otherObjectDto.Type,
                Const = otherObjectDto.Const,
                RA = otherObjectDto.RA,
                DEC = otherObjectDto.DEC,
                Mag = otherObjectDto.Mag
            };

            var added = _objectsRepo.AddOtherObject(entity);
            return Ok(ObjectDto.FromOtherObject(added, new ObjectReferenceSummary(), canEdit: true, canDelete: true));
        }

        /// <summary>
        /// Updates editable metadata while preserving the original Name identifier.
        /// </summary>
        [HttpPut("user/{id}")]
        public IActionResult PutUserObject(int id, [FromBody] UserObjectDtoForUpdate userObjectDto)
        {
            int userId = _currentUserService.GetRequiredUserId();
            if (userObjectDto == null)
            {
                return BadRequest();
            }

            var entity = _objectsRepo.GetUserObject(id, userId);
            if (entity == null)
            {
                return NotFound();
            }

            _objectsRepo.UpdateEditableFields(entity, userObjectDto);
            if (!_objectsRepo.SaveChanges())
            {
                return StatusCode(500, "Something went wrong updating the user object");
            }

            var references = _objectsRepo.GetUserObjectReferenceSummaries(userId);
            return Ok(ObjectDto.FromUserObject(entity, GetReferences(references, entity.Id)));
        }

        /// <summary>
        /// Updates shared object metadata for users who are allowed to curate shared targets.
        /// </summary>
        [HttpPut("other/{id}")]
        public IActionResult PutOtherObject(int id, [FromBody] UserObjectDtoForUpdate otherObjectDto)
        {
            int? userId = _currentUserService.GetUserId();
            if (!CanCreateOtherObjects(userId))
            {
                return Forbid();
            }

            if (otherObjectDto == null)
            {
                return BadRequest();
            }

            var entity = _objectsRepo.GetOtherObject(id);
            if (entity == null)
            {
                return NotFound();
            }

            _objectsRepo.UpdateEditableFields(entity, otherObjectDto);
            if (!_objectsRepo.SaveChanges())
            {
                return StatusCode(500, "Something went wrong updating the other object");
            }

            var references = userId.HasValue
                ? _objectsRepo.GetOtherObjectReferenceSummaries(userId.Value)
                : new System.Collections.Generic.Dictionary<int, ObjectReferenceSummary>();
            return Ok(ObjectDto.FromOtherObject(
                entity,
                GetReferences(references, entity.Id),
                canEdit: true,
                canDelete: !_objectsRepo.AnyOtherObjectReferences(entity.Id)));
        }

        /// <summary>
        /// Deletes an unreferenced user object and rejects deletion when observations still point at it.
        /// </summary>
        [HttpDelete("user/{id}")]
        public IActionResult DeleteUserObject(int id)
        {
            int userId = _currentUserService.GetRequiredUserId();
            var entity = _objectsRepo.GetUserObject(id, userId);
            if (entity == null)
            {
                return NotFound();
            }

            if (_objectsRepo.AnyUserObjectReferences(id, userId))
            {
                return BadRequest("There are observations referring to this user object. Cannot delete.");
            }

            if (!_objectsRepo.DeleteUserObject(entity))
            {
                return StatusCode(500, "Something went wrong deleting the user object");
            }

            return Ok();
        }

        /// <summary>
        /// Deletes an unreferenced shared object for users allowed to curate shared targets.
        /// </summary>
        [HttpDelete("other/{id}")]
        public IActionResult DeleteOtherObject(int id)
        {
            int? userId = _currentUserService.GetUserId();
            if (!CanCreateOtherObjects(userId))
            {
                return Forbid();
            }

            var entity = _objectsRepo.GetOtherObject(id);
            if (entity == null)
            {
                return NotFound();
            }

            if (_objectsRepo.AnyOtherObjectReferences(id))
            {
                return BadRequest("There are observations referring to this other object. Cannot delete.");
            }

            if (!_objectsRepo.DeleteOtherObject(entity))
            {
                return StatusCode(500, "Something went wrong deleting the other object");
            }

            return Ok();
        }

        /// <summary>
        /// Reads a reference summary from a dictionary, returning an empty summary when none exists.
        /// </summary>
        private static ObjectReferenceSummary GetReferences(
            System.Collections.Generic.IDictionary<int, ObjectReferenceSummary> references,
            int objectId)
        {
            return references.ContainsKey(objectId)
                ? references[objectId]
                : new ObjectReferenceSummary();
        }

        /// <summary>
        /// Allows shared object curation for configured superadmins and the original database user account.
        /// </summary>
        private bool CanCreateOtherObjects(int? userId)
        {
            var isSuperAdmin = string.Equals(
                User.FindFirstValue(AuthClaimTypes.IsSuperAdmin),
                bool.TrueString,
                StringComparison.OrdinalIgnoreCase);
            return isSuperAdmin || userId == 1;
        }
    }
}
