using System.Collections.Generic;
using System.Linq;
using ObsTool.Entities;

namespace ObsTool.Models
{
    public class ObjectListDto
    {
        public IEnumerable<ObjectDto> UserObjects { get; set; }
        public IEnumerable<ObjectDto> OtherObjects { get; set; }
        public IEnumerable<ConstellationOptionDto> Constellations { get; set; }
        public bool CanCreateOtherObjects { get; set; }
    }

    public class ObjectDto
    {
        public int Id { get; set; }
        public string ObjectKind { get; set; }
        public string ObjectKey { get; set; }
        public string Name { get; set; }
        public string OtherNames { get; set; }
        public string CommonName { get; set; }
        public string AllCommonNames { get; set; }
        public string Notes { get; set; }
        public string Type { get; set; }
        public string Const { get; set; }
        public string RA { get; set; }
        public string DEC { get; set; }
        public string Mag { get; set; }
        public int NumReferences { get; set; }
        public string[] ReferencedSessionDates { get; set; }
        public ObjectReferenceDto[] References { get; set; }
        public bool CanEdit { get; set; }
        public bool CanDelete { get; set; }

        /// <summary>
        /// Projects a readonly shared object with its per-user reference summary.
        /// </summary>
        public static ObjectDto FromOtherObject(OtherObject otherObject, ObjectReferenceSummary references, bool canEdit = false)
        {
            return new ObjectDto
            {
                Id = otherObject.Id,
                ObjectKind = ObservedObjectKind.Other,
                ObjectKey = $"{ObservedObjectKind.Other}:{otherObject.Id}",
                Name = otherObject.Name,
                OtherNames = otherObject.OtherNames,
                CommonName = otherObject.CommonName,
                AllCommonNames = otherObject.AllCommonNames,
                Notes = otherObject.Notes,
                Type = otherObject.Type,
                Const = otherObject.Const,
                RA = otherObject.RA,
                DEC = otherObject.DEC,
                Mag = otherObject.Mag,
                NumReferences = references.NumReferences,
                ReferencedSessionDates = references.SessionDates.ToArray(),
                References = references.Sessions.ToArray(),
                CanEdit = canEdit,
                CanDelete = false
            };
        }

        /// <summary>
        /// Projects a user-owned object with edit/delete flags derived from reference usage.
        /// </summary>
        public static ObjectDto FromUserObject(UserObject userObject, ObjectReferenceSummary references)
        {
            return new ObjectDto
            {
                Id = userObject.Id,
                ObjectKind = ObservedObjectKind.User,
                ObjectKey = $"{ObservedObjectKind.User}:{userObject.Id}",
                Name = userObject.Name,
                OtherNames = userObject.OtherNames,
                CommonName = userObject.CommonName,
                AllCommonNames = userObject.AllCommonNames,
                Notes = userObject.Notes,
                Type = userObject.Type,
                Const = userObject.Const,
                RA = userObject.RA,
                DEC = userObject.DEC,
                Mag = userObject.Mag,
                NumReferences = references.NumReferences,
                ReferencedSessionDates = references.SessionDates.ToArray(),
                References = references.Sessions.ToArray(),
                CanEdit = true,
                CanDelete = references.NumReferences == 0
            };
        }
    }

    public class UserObjectDtoForCreation
    {
        public string Name { get; set; }
        public string OtherNames { get; set; }
        public string CommonName { get; set; }
        public string AllCommonNames { get; set; }
        public string Notes { get; set; }
        public string Type { get; set; }
        public string Const { get; set; }
        public string RA { get; set; }
        public string DEC { get; set; }
        public string Mag { get; set; }
    }

    public class OtherObjectDtoForCreation
    {
        public string Name { get; set; }
        public string OtherNames { get; set; }
        public string CommonName { get; set; }
        public string AllCommonNames { get; set; }
        public string Notes { get; set; }
        public string Type { get; set; }
        public string Const { get; set; }
        public string RA { get; set; }
        public string DEC { get; set; }
        public string Mag { get; set; }
    }

    public class UserObjectDtoForUpdate
    {
        public string OtherNames { get; set; }
        public string CommonName { get; set; }
        public string AllCommonNames { get; set; }
        public string Notes { get; set; }
        public string Type { get; set; }
        public string Const { get; set; }
        public string RA { get; set; }
        public string DEC { get; set; }
        public string Mag { get; set; }
    }

    public class ObjectReferenceSummary
    {
        public int NumReferences { get; set; }
        public IEnumerable<string> SessionDates { get; set; } = Enumerable.Empty<string>();
        public IEnumerable<ObjectReferenceDto> Sessions { get; set; } = Enumerable.Empty<ObjectReferenceDto>();
    }

    public class ObjectReferenceDto
    {
        public int ObsSessionId { get; set; }
        public string Date { get; set; }
    }

    public class ConstellationOptionDto
    {
        public string Name { get; set; }
        public string Abbreviation { get; set; }
    }
}
