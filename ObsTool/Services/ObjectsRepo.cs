using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using ObsTool.Database;
using ObsTool.Entities;
using ObsTool.Models;

namespace ObsTool.Services
{
    public class ObjectsRepo
    {
        private readonly MainDbContext _dbContext;

        public ObjectsRepo(MainDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        /// <summary>
        /// Loads all shared readonly objects in deterministic display order.
        /// </summary>
        public IEnumerable<OtherObject> GetOtherObjects()
        {
            return _dbContext.OtherObjects
                .OrderBy(otherObject => otherObject.Name)
                .ThenBy(otherObject => otherObject.Id)
                .ToList();
        }

        /// <summary>
        /// Loads constellation names and abbreviations for object-entry dropdowns.
        /// </summary>
        public IEnumerable<ConstellationOptionDto> GetConstellationOptions()
        {
            return _dbContext.Constellations
                .OrderBy(constellation => constellation.Name)
                .Select(constellation => new ConstellationOptionDto
                {
                    Name = constellation.Name,
                    Abbreviation = constellation.Abbreviation
                })
                .ToList();
        }

        /// <summary>
        /// Loads all editable objects for the current user in deterministic display order.
        /// </summary>
        public IEnumerable<UserObject> GetUserObjects(int userId)
        {
            return _dbContext.UserObjects
                .Where(userObject => userObject.UserId == userId)
                .OrderBy(userObject => userObject.Name)
                .ThenBy(userObject => userObject.Id)
                .ToList();
        }

        /// <summary>
        /// Searches user-owned objects through the same normalized text keys used by SAC object search.
        /// </summary>
        public IEnumerable<UserObject> GetUserObjectsByQueryString(string queryString, int userId)
        {
            var queryKeys = DsoDesignationNormalizer.BuildSearchKeys(queryString);
            if (queryKeys.Count == 0)
            {
                return Enumerable.Empty<UserObject>();
            }

            return _dbContext.UserObjects
                .Where(userObject => userObject.UserId == userId)
                .OrderBy(userObject => userObject.Name)
                .ThenBy(userObject => userObject.Id)
                .AsEnumerable()
                .Where(userObject => ObjectMatchesSearch(userObject, queryKeys))
                .ToList();
        }

        /// <summary>
        /// Searches shared non-SAC objects through the same normalized text keys used by SAC object search.
        /// </summary>
        public IEnumerable<OtherObject> GetOtherObjectsByQueryString(string queryString)
        {
            var queryKeys = DsoDesignationNormalizer.BuildSearchKeys(queryString);
            if (queryKeys.Count == 0)
            {
                return Enumerable.Empty<OtherObject>();
            }

            return _dbContext.OtherObjects
                .OrderBy(otherObject => otherObject.Name)
                .ThenBy(otherObject => otherObject.Id)
                .AsEnumerable()
                .Where(otherObject => ObjectMatchesSearch(otherObject, queryKeys))
                .ToList();
        }

        /// <summary>
        /// Returns a single user object, scoped to the owner so object edits cannot cross accounts.
        /// </summary>
        public UserObject GetUserObject(int id, int userId)
        {
            return _dbContext.UserObjects.FirstOrDefault(userObject => userObject.Id == id && userObject.UserId == userId);
        }

        /// <summary>
        /// Returns a single shared object for privileged metadata editing.
        /// </summary>
        public OtherObject GetOtherObject(int id)
        {
            return _dbContext.OtherObjects.FirstOrDefault(otherObject => otherObject.Id == id);
        }

        /// <summary>
        /// Creates a user object after validating the parser-visible stable name.
        /// </summary>
        public UserObject AddUserObject(UserObject userObject, int userId)
        {
            NormalizeObjectFields(userObject);
            ValidateObjectName(userObject.Name);
            if (UserObjectNameExists(userObject.Name, userId))
            {
                throw new ObsToolException($"A user object named '{userObject.Name}' already exists.");
            }

            string matchingOtherObjectName = GetExistingOtherObjectName(userObject.Name);
            if (matchingOtherObjectName != null)
            {
                throw new ObsToolException($"An other object named '{matchingOtherObjectName}' already exists.");
            }

            RejectExistingSacObjectConflict(userObject.Name);

            userObject.UserId = userId;
            userObject.ModifiedDate = DateTime.UtcNow;
            var added = _dbContext.UserObjects.Add(userObject);
            _dbContext.SaveChanges();
            return added.Entity;
        }

        /// <summary>
        /// Creates a shared object after validating the parser-visible stable name.
        /// </summary>
        public OtherObject AddOtherObject(OtherObject otherObject)
        {
            NormalizeObjectFields(otherObject);
            ValidateObjectName(otherObject.Name);
            if (OtherObjectNameExists(otherObject.Name))
            {
                throw new ObsToolException($"An other object named '{otherObject.Name}' already exists.");
            }

            RejectExistingSacObjectConflict(otherObject.Name);

            otherObject.ModifiedDate = DateTime.UtcNow;
            var added = _dbContext.OtherObjects.Add(otherObject);
            _dbContext.SaveChanges();
            return added.Entity;
        }

        /// <summary>
        /// Updates editable user-object metadata while preserving Name as the parser-stable identifier.
        /// </summary>
        public void UpdateEditableFields(UserObject target, UserObjectDtoForUpdate update)
        {
            target.OtherNames = NormalizeOptionalText(update.OtherNames);
            target.CommonName = NormalizeOptionalText(update.CommonName);
            target.AllCommonNames = NormalizeOptionalText(update.AllCommonNames);
            target.Notes = NormalizeOptionalText(update.Notes);
            target.Type = NormalizeOptionalText(update.Type);
            target.Const = NormalizeOptionalText(update.Const);
            target.RA = NormalizeOptionalText(update.RA);
            target.DEC = NormalizeOptionalText(update.DEC);
            target.Mag = NormalizeOptionalText(update.Mag);
            target.ModifiedDate = DateTime.UtcNow;
        }

        /// <summary>
        /// Updates editable shared-object metadata while preserving Name as the parser-stable identifier.
        /// </summary>
        public void UpdateEditableFields(OtherObject target, UserObjectDtoForUpdate update)
        {
            target.OtherNames = NormalizeOptionalText(update.OtherNames);
            target.CommonName = NormalizeOptionalText(update.CommonName);
            target.AllCommonNames = NormalizeOptionalText(update.AllCommonNames);
            target.Notes = NormalizeOptionalText(update.Notes);
            target.Type = NormalizeOptionalText(update.Type);
            target.Const = NormalizeOptionalText(update.Const);
            target.RA = NormalizeOptionalText(update.RA);
            target.DEC = NormalizeOptionalText(update.DEC);
            target.Mag = NormalizeOptionalText(update.Mag);
            target.ModifiedDate = DateTime.UtcNow;
        }

        /// <summary>
        /// Deletes an unreferenced user object; callers are expected to check references first.
        /// </summary>
        public bool DeleteUserObject(UserObject userObject)
        {
            _dbContext.UserObjects.Remove(userObject);
            return _dbContext.SaveChanges() > 0;
        }

        /// <summary>
        /// Deletes an unreferenced shared object; callers are expected to check references first.
        /// </summary>
        public bool DeleteOtherObject(OtherObject otherObject)
        {
            _dbContext.OtherObjects.Remove(otherObject);
            return _dbContext.SaveChanges() > 0;
        }

        /// <summary>
        /// Returns whether a user object currently participates in any observation link for this user.
        /// </summary>
        public bool AnyUserObjectReferences(int userObjectId, int userId)
        {
            return _dbContext.DsoObservations
                .Any(dsoObservation =>
                    dsoObservation.UserObjectId == userObjectId &&
                    dsoObservation.Observation.UserId == userId);
        }

        /// <summary>
        /// Returns whether a shared object participates in any observation link across all users.
        /// </summary>
        public bool AnyOtherObjectReferences(int otherObjectId)
        {
            return _dbContext.DsoObservations
                .Any(dsoObservation => dsoObservation.OtherObjectId == otherObjectId);
        }

        /// <summary>
        /// Saves pending user-object updates.
        /// </summary>
        public bool SaveChanges()
        {
            return _dbContext.SaveChanges() > 0;
        }

        /// <summary>
        /// Builds reference counts and distinct session links for the Objects page.
        /// </summary>
        public Dictionary<int, ObjectReferenceSummary> GetOtherObjectReferenceSummaries(int userId)
        {
            return GetObjectReferenceSummaries(userId, dsoObservation => dsoObservation.OtherObjectId);
        }

        /// <summary>
        /// Builds reference counts and distinct session links for user-owned objects.
        /// </summary>
        public Dictionary<int, ObjectReferenceSummary> GetUserObjectReferenceSummaries(int userId)
        {
            return GetObjectReferenceSummaries(userId, dsoObservation => dsoObservation.UserObjectId);
        }

        /// <summary>
        /// Validates object names before they become parser identifier tokens.
        /// </summary>
        public static void ValidateObjectName(string name)
        {
            if (string.IsNullOrWhiteSpace(name))
            {
                throw new ObsToolException("Object name is required.");
            }

            if (name.IndexOfAny(new[] { '[', ']', '{', '}', '#', '\r', '\n' }) >= 0)
            {
                throw new ObsToolException("Object names cannot contain [, ], {, }, #, or line breaks.");
            }
        }

        /// <summary>
        /// Checks user-object names with the same normalization used by the report parser.
        /// </summary>
        private bool UserObjectNameExists(string name, int userId)
        {
            string normalizedName = DsoDesignationNormalizer.NormalizeFreeText(name);
            return _dbContext.UserObjects
                .Where(userObject => userObject.UserId == userId)
                .AsEnumerable()
                .Any(userObject => DsoDesignationNormalizer.NormalizeFreeText(userObject.Name) == normalizedName);
        }

        /// <summary>
        /// Checks shared object names with the same normalization used by the report parser.
        /// </summary>
        private bool OtherObjectNameExists(string name)
        {
            return GetExistingOtherObjectName(name) != null;
        }

        /// <summary>
        /// Returns the stored shared object name that matches a proposed object name after normalization.
        /// </summary>
        private string GetExistingOtherObjectName(string name)
        {
            string normalizedName = DsoDesignationNormalizer.NormalizeFreeText(name);
            return _dbContext.OtherObjects
                .AsEnumerable()
                .FirstOrDefault(otherObject => DsoDesignationNormalizer.NormalizeFreeText(otherObject.Name) == normalizedName)
                ?.Name;
        }

        /// <summary>
        /// Prevents custom objects from claiming a SAC catalog name or designation alias.
        /// </summary>
        private void RejectExistingSacObjectConflict(string name)
        {
            Dso existingDso = GetSacObjectByCatalogIdentity(name);
            if (existingDso != null)
            {
                throw new ObsToolException($"A SAC object named '{existingDso.Name}' already exists.");
            }
        }

        /// <summary>
        /// Finds exact normalized SAC matches using only catalog identity fields, not common display names.
        /// </summary>
        private Dso GetSacObjectByCatalogIdentity(string name)
        {
            var requestedKeys = DsoDesignationNormalizer.BuildExactKeys(name);
            if (requestedKeys.Count == 0)
            {
                return null;
            }

            return _dbContext.Dso
                .AsEnumerable()
                .FirstOrDefault(dso => SacCatalogIdentityMatches(dso, requestedKeys));
        }

        /// <summary>
        /// Checks one SAC row's primary name and designation aliases against the requested keys.
        /// </summary>
        private static bool SacCatalogIdentityMatches(Dso dso, IReadOnlyCollection<string> requestedKeys)
        {
            return DsoDesignationNormalizer.BuildExactKeys(dso.Name).Any(requestedKeys.Contains)
                || DsoDesignationNormalizer.BuildExactKeys(dso.OtherNames).Any(requestedKeys.Contains);
        }

        /// <summary>
        /// Checks all searchable custom-object label fields against the normalized query keys.
        /// </summary>
        private static bool ObjectMatchesSearch(UserObject userObject, IReadOnlyCollection<string> queryKeys)
        {
            return ObjectMatchesSearch(userObject.Name, userObject.OtherNames, userObject.CommonName, userObject.AllCommonNames, queryKeys);
        }

        /// <summary>
        /// Checks all searchable shared-object label fields against the normalized query keys.
        /// </summary>
        private static bool ObjectMatchesSearch(OtherObject otherObject, IReadOnlyCollection<string> queryKeys)
        {
            return ObjectMatchesSearch(otherObject.Name, otherObject.OtherNames, otherObject.CommonName, otherObject.AllCommonNames, queryKeys);
        }

        /// <summary>
        /// Matches query keys by substring so custom-object search behaves like the SAC catalog index.
        /// </summary>
        private static bool ObjectMatchesSearch(
            string name,
            string otherNames,
            string commonName,
            string allCommonNames,
            IReadOnlyCollection<string> queryKeys)
        {
            var objectKeys = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            AddObjectSearchKeys(objectKeys, name);
            AddObjectSearchKeys(objectKeys, otherNames);
            AddObjectSearchKeys(objectKeys, commonName);
            AddObjectSearchKeys(objectKeys, allCommonNames);

            return queryKeys.Any(queryKey =>
                objectKeys.Any(objectKey => objectKey.Contains(queryKey, StringComparison.OrdinalIgnoreCase)));
        }

        /// <summary>
        /// Adds normalized keys for one custom-object search field.
        /// </summary>
        private static void AddObjectSearchKeys(ISet<string> objectKeys, string value)
        {
            foreach (string key in DsoDesignationNormalizer.BuildSearchKeys(value))
            {
                objectKeys.Add(key);
            }
        }

        /// <summary>
        /// Trims all object-entry fields and stores blank optional values as null.
        /// </summary>
        private static void NormalizeObjectFields(OtherObject otherObject)
        {
            otherObject.Name = NormalizeRequiredText(otherObject.Name);
            otherObject.OtherNames = NormalizeOptionalText(otherObject.OtherNames);
            otherObject.CommonName = NormalizeOptionalText(otherObject.CommonName);
            otherObject.AllCommonNames = NormalizeOptionalText(otherObject.AllCommonNames);
            otherObject.Notes = NormalizeOptionalText(otherObject.Notes);
            otherObject.Type = NormalizeOptionalText(otherObject.Type);
            otherObject.Const = NormalizeOptionalText(otherObject.Const);
            otherObject.RA = NormalizeOptionalText(otherObject.RA);
            otherObject.DEC = NormalizeOptionalText(otherObject.DEC);
            otherObject.Mag = NormalizeOptionalText(otherObject.Mag);
        }

        /// <summary>
        /// Trims all user-object fields and stores blank optional values as null.
        /// </summary>
        private static void NormalizeObjectFields(UserObject userObject)
        {
            userObject.Name = NormalizeRequiredText(userObject.Name);
            userObject.OtherNames = NormalizeOptionalText(userObject.OtherNames);
            userObject.CommonName = NormalizeOptionalText(userObject.CommonName);
            userObject.AllCommonNames = NormalizeOptionalText(userObject.AllCommonNames);
            userObject.Notes = NormalizeOptionalText(userObject.Notes);
            userObject.Type = NormalizeOptionalText(userObject.Type);
            userObject.Const = NormalizeOptionalText(userObject.Const);
            userObject.RA = NormalizeOptionalText(userObject.RA);
            userObject.DEC = NormalizeOptionalText(userObject.DEC);
            userObject.Mag = NormalizeOptionalText(userObject.Mag);
        }

        /// <summary>
        /// Trims required text while leaving validation to the caller.
        /// </summary>
        private static string NormalizeRequiredText(string value)
        {
            return value?.Trim();
        }

        /// <summary>
        /// Trims optional text and converts blank values to null for storage.
        /// </summary>
        private static string NormalizeOptionalText(string value)
        {
            var normalized = value?.Trim();
            return string.IsNullOrWhiteSpace(normalized) ? null : normalized;
        }

        /// <summary>
        /// Aggregates object references through DsoObservations and their parent sessions.
        /// </summary>
        private Dictionary<int, ObjectReferenceSummary> GetObjectReferenceSummaries(
            int userId,
            Func<DsoObservation, int?> objectIdSelector)
        {
            return _dbContext.DsoObservations
                .Include(dsoObservation => dsoObservation.Observation)
                .Where(dsoObservation => dsoObservation.Observation.UserId == userId)
                .AsEnumerable()
                .Select(dsoObservation => new
                {
                    ObjectId = objectIdSelector(dsoObservation),
                    dsoObservation.Observation.ObsSessionId
                })
                .Where(row => row.ObjectId.HasValue)
                .Join(
                    _dbContext.ObsSessions.Where(session => session.UserId == userId).AsEnumerable(),
                    row => row.ObsSessionId,
                    session => session.Id,
                    (row, session) => new { ObjectId = row.ObjectId.Value, ObsSessionId = session.Id, session.Date })
                .GroupBy(row => row.ObjectId)
                .ToDictionary(
                    group => group.Key,
                    group => new ObjectReferenceSummary
                    {
                        NumReferences = group.Count(),
                        SessionDates = group
                            .Select(row => row.Date?.ToString("yyyy-MM-dd"))
                            .Where(date => !string.IsNullOrWhiteSpace(date))
                            .Distinct()
                            .OrderByDescending(date => date)
                            .ToArray(),
                        Sessions = group
                            .GroupBy(row => row.ObsSessionId)
                            .Select(sessionGroup => new ObjectReferenceDto
                            {
                                ObsSessionId = sessionGroup.Key,
                                Date = sessionGroup
                                    .Select(row => row.Date?.ToString("yyyy-MM-dd"))
                                    .FirstOrDefault(date => !string.IsNullOrWhiteSpace(date))
                            })
                            .Where(session => !string.IsNullOrWhiteSpace(session.Date))
                            .OrderByDescending(session => session.Date)
                            .ThenByDescending(session => session.ObsSessionId)
                            .ToArray()
                    });
        }
    }
}
