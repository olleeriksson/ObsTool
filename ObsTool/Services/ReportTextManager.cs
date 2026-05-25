using ObsTool.Entities;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using ObsTool.Utils;
using ObsTool.Database;

namespace ObsTool.Services
{
    public class ReportTextManager
    {
        private const string ObservationIdentifierPattern = @"\d+(?:-(?:\d+|![A-Z0-9]+!))*";
        private const string DecoratedObservationIdentifierPattern = @"\s(#(" + ObservationIdentifierPattern + @"))[\s\.$]?";

        private MainDbContext _dbContext;
        private ObservationsRepo _observationsRepo;
        private IDsoRepo _dsoRepo;
        private IInstrumentsRepo _instrumentsRepo;
        private ILogger<ReportTextManager> _logger;
        private DsoObservationsRepo _dsoObservationsRepo;

        public ReportTextManager(MainDbContext dbContext, ObservationsRepo observationsRepo, IDsoRepo dsoRepo,
            ILogger<ReportTextManager> logger, DsoObservationsRepo dsoObservationsRepo)
            : this(dbContext, observationsRepo, dsoRepo, logger, dsoObservationsRepo, null)
        {
        }

        public ReportTextManager(MainDbContext dbContext, ObservationsRepo observationsRepo, IDsoRepo dsoRepo,
            ILogger<ReportTextManager> logger, DsoObservationsRepo dsoObservationsRepo, IInstrumentsRepo instrumentsRepo)
        {
            _dbContext = dbContext;
            _observationsRepo = observationsRepo;
            _dsoRepo = dsoRepo;
            _logger = logger;
            _dsoObservationsRepo = dsoObservationsRepo;
            _instrumentsRepo = instrumentsRepo;
        }

        public void DisplayName() => Console.WriteLine(ToString());

        /// <summary>
        /// Builds a safe catalog alternation, preferring longer catalog names so Sh2 is matched before Sh.
        /// </summary>
        public string RegExpJoinCatalogs(IEnumerable<string> catalogs) => string.Join("|", catalogs
            .Where(catalog => !string.IsNullOrWhiteSpace(catalog))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderByDescending(catalog => catalog.Length)
            .Select(Regex.Escape));

        public void ParseAndStoreObservations(ObsSession obsSession)
        {
            // Parse
            OrderedDictionary<string, Observation> updatedObservations = Parse(
                obsSession,
                out ISet<string> identifiersFoundInReportText,
                out ISet<string> identifiersWithUnmatchedDsoNames);
            // All returned observations are to be either updated or added, that is decided further down
            // by looking at the currently stored observations.

            // Replace list of Observations on the ObsSession
            _dbContext.Entry(obsSession).Collection("Observations").Load();

            List<Observation> observationsToDelete = obsSession.Observations
                .Where(oldObs => ShouldDeleteExistingObservation(oldObs, updatedObservations, identifiersFoundInReportText))
                .ToList();

            // Find out which observations to delete (and not just update)
            foreach (Observation observationToDelete in observationsToDelete)
            {
                // Log them if they have resources on them
                _dbContext.Entry(observationToDelete).Collection("ObsResources").Load();
                if (observationToDelete.ObsResources.Count > 0)
                {
                    _logger.LogInformation("Implicitly (under the hood) deleting an observation containing the following resources:");
                    foreach (ObsResource obsResource in observationToDelete.ObsResources)
                    {
                        _logger.LogInformation(PocoPrinter.ToString(obsResource));
                    }
                }
                // we never delete the ObsResources   // doesn't seem needed, just loading them

                // Load the Observations' DsoObservations and remove them
                _dbContext.Entry(observationToDelete).Collection("DsoObservations").Load();
                //observationToDelete.DsoObservations.RemoveAll(dsoObs => true);  // doesn't seam needed, just loading them

                // Then delete them
                Debug.WriteLine("Deleting observation with identifier " + observationToDelete.Identifier);
                obsSession.Observations.Remove(observationToDelete);
            }

            // First off, start by creating a dictionary of the existing observations for easier lookup
            IDictionary<string, Observation> existingObservations = new Dictionary<string, Observation>();
            foreach (Observation existingObservation in obsSession.Observations)
            {
                if (!string.IsNullOrEmpty(existingObservation.Identifier))
                {
                    existingObservations.Add(existingObservation.Identifier, existingObservation);
                }
            }

            // Then go through observations that already existed, and that should be updated with the new data
            foreach (Observation existingObservation in obsSession.Observations)
            {
                if (!string.IsNullOrEmpty(existingObservation.Identifier)
                    && updatedObservations.ContainsKey(existingObservation.Identifier))
                {
                    Observation updatedObservation = updatedObservations[existingObservation.Identifier];

                    // Transfer/update the observation
                    existingObservation.Text = updatedObservation.Text;
                    existingObservation.DisplayOrder = updatedObservation.DisplayOrder;
                    existingObservation.NonDetection = updatedObservation.NonDetection;
                    existingObservation.InstrumentId = updatedObservation.InstrumentId;
                    existingObservation.UserId = obsSession.UserId;

                    _dbContext.Entry(existingObservation).Collection("DsoObservations").Load();
                    _dbContext.Entry(existingObservation).Collection("ObsResources").Load();

                    // Set the existing observation id or we get duplicate errors etc when persisting.
                    // During the Parse() stage above we are not aware of the existing observations' ids.
                    foreach (DsoObservation dsoObservation in updatedObservation.DsoObservations)
                    {
                        dsoObservation.ObservationId = existingObservation.Id;
                    }

                    UpdateDsoObservations(
                        existingObservation,
                        updatedObservation,
                        identifiersWithUnmatchedDsoNames.Contains(existingObservation.Identifier));
                    AddNewObsResources(existingObservation, updatedObservation);
                }
            }

            // Finally, add those observations that are new, that didn't exist before
            foreach (Observation updatedObservation in updatedObservations.Values)
            {
                if (!existingObservations.ContainsKey(updatedObservation.Identifier))  // it doesn't exists, add it!
                {
                    var newObservation = updatedObservation;  // just to clearly indicate that it's a new one
                    // New obs resources will automatically tag along in this situation and get created.
                    Debug.WriteLine("Adding new observation for observation with Identifier " + newObservation.Identifier);
                    obsSession.Observations.Add(newObservation);

                    // Any obs resources get automatically created.
                }
            }

            SaveChanges();
        }

        /// <summary>
        /// Decides whether an existing observation should be removed after the report text has been reparsed.
        /// </summary>
        private bool ShouldDeleteExistingObservation(
            Observation existingObservation,
            OrderedDictionary<string, Observation> updatedObservations,
            ISet<string> identifiersFoundInReportText)
        {
            if (!string.IsNullOrEmpty(existingObservation.Identifier)
                && updatedObservations.ContainsKey(existingObservation.Identifier))
            {
                return false;
            }

            if (!string.IsNullOrEmpty(existingObservation.Identifier)
                && identifiersFoundInReportText.Contains(existingObservation.Identifier))
            {
                if (ObservationHasResources(existingObservation))
                {
                    throw new ObsToolException(
                        $"Save aborted: observation {existingObservation.Identifier} still exists in the report text, "
                        + "but its object names no longer resolve to the catalog. It has attached resources, so update the object name or catalog alias before saving.");
                }
            }

            if (ObservationHasResources(existingObservation))
            {
                throw new ObsToolException(
                    $"Save aborted: observation {existingObservation.Identifier} would be removed or replaced after reparsing the report text, "
                    + "and it has attached resources. Remove those resources explicitly first, or keep the observation identifier intact.");
            }

            return true;
        }

        /// <summary>
        /// Loads the resource collection before checking it because delete decisions run on observations from the session aggregate.
        /// </summary>
        private bool ObservationHasResources(Observation observation)
        {
            _dbContext.Entry(observation).Collection("ObsResources").Load();
            return observation.ObsResources.Count > 0;
        }

        /// <summary>
        /// Updates the existing list of DsoObservations for the current Observation with
        /// a new list of DsoObservations, which might contain new, some updated, and some removed.
        /// </summary>
        private void UpdateDsoObservations(
            Observation existingObservation,
            Observation updatedObservation,
            bool sectionHasUnmatchedDsoNames)
        {
            List<DsoObservation> existingDsoObservations = existingObservation.DsoObservations;
            List<DsoObservation> updatedDsoObservations = updatedObservation.DsoObservations;

            // Remove all DsoObservations that aren't in the updatedObservation
            var toRemove = new List<DsoObservation>();
            foreach (DsoObservation existingDsoObservation in existingDsoObservations)
            {
                if (!updatedDsoObservations.Contains(existingDsoObservation))
                {
                    if (sectionHasUnmatchedDsoNames && existingObservation.ObsResources.Count > 0)
                    {
                        throw new ObsToolException(
                            $"Save aborted: observation {existingObservation.Identifier} has attached resources, "
                            + "and at least one object name in that report section no longer resolves to the catalog. "
                            + "Update the object name or catalog alias before saving.");
                    }

                    toRemove.Add(existingDsoObservation);  // mark for removal
                }
            }
            // Delayed remove because we can't modify a list we're iterating over
            foreach (DsoObservation dsoObsToRemove in toRemove)
            {
                // Setting the foreign key resolved entities to null was the key to actually
                // having EF core delete these.
                dsoObsToRemove.Observation = null;
                dsoObsToRemove.Dso = null;

                existingDsoObservations.Remove(dsoObsToRemove);
            }

            // Add all new DsoObservations, and update existing ones
            foreach (DsoObservation newDsoObservation in updatedDsoObservations)
            {
                // Add new ones
                if (!existingDsoObservations.Contains(newDsoObservation))
                {
                    existingDsoObservations.Add(newDsoObservation);
                }
                else
                {
                    // Get the existing one and update it
                    var existingDsoObservation = existingDsoObservations.Find(i => i.Equals(newDsoObservation));  // compares the PK ids
                    existingDsoObservation.DisplayOrder = newDsoObservation.DisplayOrder;
                    existingDsoObservation.NonDetection = newDsoObservation.NonDetection;
                }
            }
        }

        /// <summary>
        /// Updates the existing list of ObsResources for the current Observation with
        /// a new list of DsoObservations, which might contain new, some updated, and some removed.
        /// </summary>
        private void AddNewObsResources(Observation existingObservation, Observation updatedObservation)
        {
            List<ObsResource> existingObsResources = existingObservation.ObsResources;
            List<ObsResource> updatedObsResources = updatedObservation.ObsResources;

            // Add all new DsoObservations, and update existing ones
            foreach (ObsResource newObsResource in updatedObsResources)
            {
                // If a resource with the same type and url doesn't already exist, add it!
                if (!existingObsResources.Any(obsRes => obsRes.Type == newObsResource.Type && obsRes.Url == newObsResource.Url))
                {
                    newObsResource.UserId = existingObservation.UserId;
                    existingObsResources.Add(newObsResource);
                }
            }
        }

        public OrderedDictionary<string, Observation> Parse(ObsSession obsSession)
        {
            return Parse(obsSession, out _, out _);
        }

        /// <summary>
        /// Parses report text and reports identifiers whose existing resource links need save-time validation.
        /// </summary>
        private OrderedDictionary<string, Observation> Parse(
            ObsSession obsSession,
            out ISet<string> identifiersFoundInReportText,
            out ISet<string> identifiersWithUnmatchedDsoNames)
        {
            string reportText = obsSession.ReportText;
            OrderedDictionary<string, Observation> observationsDict = new OrderedDictionary<string, Observation>();
            IDictionary<Match, string> newSectionMatchesDict = new Dictionary<Match, string>();
            identifiersFoundInReportText = FindExistingObsIdentifiers(reportText);
            identifiersWithUnmatchedDsoNames = new HashSet<string>();

            // If report text is empty, just return
            if (reportText == null)
            {
                return observationsDict;
            }

            //string[] primaryCatalogs = { "M", "NGC", "IC", "Sh", "UGC", "PGC" };

            // Get a list of all catalogs designators to search for
            var allCatalogs = _dsoRepo.GetAllCatalogs();
            allCatalogs.Add("Sh2");

            // Regexp for finding DSO names
            string regexpAllCatalogs = RegExpJoinCatalogs(allCatalogs);
            string introRegexp = @"(?:\s|\G)";  // non-capturing group of \s or end-of-previous-match (for when the designator starts at the beginning of the line)
            string startingMarkerRegexp = @"([(!])?";  // Start markers: ( and !
            string firstCatalogNumberPartRegexp = @"[+-]?\s*[0-9]+[A-Za-z]?";
            string additionalCatalogNumberPartRegexp = @"(?:\s*[\+\-\.]\s*[A-Za-z]?\s*[0-9]+[A-Za-z]?)*";
            string catalogNumberRegexp = "(" + firstCatalogNumberPartRegexp + additionalCatalogNumberPartRegexp + ")";
            string endingMarkerRegexp = @"([)!])?";    // End markers: ) and !
            string outroRegexp = @"(?=\s|[\.,]|$)";

            // The ?: at the start of one of the groups is to make that the group is non-capturing.
            // This results in the fourth group always being the ending marker (parenthesis or bang).
            string dsoNameRegexp = introRegexp
                + startingMarkerRegexp
                + "(" + regexpAllCatalogs + @")(?:\s+|-)?"
                + catalogNumberRegexp
                + endingMarkerRegexp
                + outroRegexp;
            var findDsoNamesRegexp = new Regex(dsoNameRegexp, RegexOptions.Compiled | RegexOptions.IgnoreCase);

            // Regexp for finding text sections that include DSO names
            string sectionStart = @"[^\n]*";  // the ? after the * makes it non-greedy, or else it doesn't stop at the first section end in singleline (all text as one string) mode
            string sectionEnding = @".*?(?:\n\n|\r\n\r\n|\n$|\r\n$|$)";  // a section can end with \n\n, or \n$, or just $. The ?: after the parenthesis makes the group non-capturing.
            string findSectionRegexp = sectionStart
                + dsoNameRegexp
                + sectionEnding;

            // The RegexOptions.Singleline below is what makes it find sections that include a newline and then a Photo:/Link:/Sketch:/Jot: tag.
            // It also makes it necessary to use a ? in .*? to make it non-greedy.
            var findSectionsRegexp = new Regex(findSectionRegexp,
                RegexOptions.Compiled | RegexOptions.IgnoreCase | RegexOptions.Singleline);

            string resourceRegexp = @"(Link|Image|Photo|Sketch|Jot):\s?(.*)";
            var findResourcesRegexp = new Regex(resourceRegexp, RegexOptions.Compiled | RegexOptions.IgnoreCase);

            string flagOutro = @"(?:\s|\.|$)";  // non-capturing group of \s or . or $

            string nonDetectionRegexp = @"!!" + flagOutro;
            var findNonDetectionRegexp = new Regex(nonDetectionRegexp, RegexOptions.Compiled | RegexOptions.IgnoreCase);

            string ratingRegexp = @"\s(-1|\+1|\+2|\*|\*\*)" + flagOutro;
            var findRatingRegexp = new Regex(ratingRegexp, RegexOptions.Compiled | RegexOptions.IgnoreCase);

            string followUpRegexp = @"\s(re-?visit|come back|telescope)" + flagOutro;
            var findFollowUpRegexp = new Regex(followUpRegexp, RegexOptions.Compiled | RegexOptions.IgnoreCase);

            var scopeMatches = Regex.Matches(
                reportText,
                @"^\s*Scope:\s*(.+?)\s*$",
                RegexOptions.Compiled | RegexOptions.IgnoreCase | RegexOptions.Multiline)
                .Cast<Match>()
                .ToList();

            if (findSectionsRegexp.IsMatch(reportText))  // matches anywhere
            {
                int obsIndex = 0;
                ISet<int> foundDsoIds = new HashSet<int>();
                ISet<string> foundUnmatchedDsoNames = new HashSet<string>();

                MatchCollection sectionsMatches = findSectionsRegexp.Matches(reportText);  // matching on the whole report text
                foreach (Match sectionsMatch in sectionsMatches)
                {
                    string sectionText = sectionsMatch.Value.Trim();  // the whole section, including resource links
                    string replacedDeprectedIdentifiers = ReplaceDeprecatedObsIdentifiers(sectionText);
                    var observationsIdentifier = FindExistingObsIdentifier(replacedDeprectedIdentifiers);
                    int? sectionInstrumentId = GetInstrumentIdForSection(obsSession.UserId, obsSession.InstrumentId, scopeMatches, sectionsMatch.Index);

                    string sectionObsText = GetPartBeforeFirstNewlineIfAny(sectionText);
                    var dsosInSection = new Dictionary<int, Dso>();
                    var nonDetectionDsosInSection = new Dictionary<int, bool>();
                    var unmatchedDsoNamesInSection = new Dictionary<string, bool>();
                    var obsResourcesInSection = new List<ObsResource>();

                    // Collect all the DSO's in the section text.
                    MatchCollection dsoNameMatches = findDsoNamesRegexp.Matches(sectionObsText);  // matching on a single section
                    foreach (Match dsoNameMatch in dsoNameMatches)
                    {
                        string startMarker = dsoNameMatch.Groups[1].Value;
                        string catalog = GetCanonicalCatalogName(dsoNameMatch.Groups[2].Value, allCatalogs);
                        string catalogNo = dsoNameMatch.Groups[3].Value;
                        string endMarker = dsoNameMatch.Groups[4].Value;
                        string dsoName = $"{catalog} {catalogNo}";

                        Debug.WriteLine("---------------------------------------------------------");
                        Debug.WriteLine($"Match: {catalog} {catalogNo}");
                        //Debug.WriteLine($"Match: {sectionText}");

                        bool startIsBang = startMarker == "!";
                        bool endIsBang   = endMarker   == "!";

                        // Unbalanced bang markers — surface as error so the user finds the typo
                        if (startIsBang != endIsBang)
                        {
                            throw new ObsToolException(
                                $"Save aborted. DSO {dsoName} has unmatched non-detection markers — wrap it on both sides: !{dsoName}!");
                        }
                        bool isNonDetectionDso = startIsBang && endIsBang;

                        // Ignore pattern if it's surrounded by parenthesis (existing behaviour)
                        if (startMarker == "(" || endMarker == ")")
                        {
                            continue;
                        }

                        Dso dso = obsSession.UserId > 0
                            ? _dsoRepo.GetDsoByName(dsoName, normalize: false, userId: obsSession.UserId)
                            : _dsoRepo.GetDsoByName(dsoName, normalize: false);
                        if (dso == null)
                        {
                            string unmatchedDsoName = NormalizeUnmatchedDsoName(dsoName);
                            if (!string.IsNullOrEmpty(observationsIdentifier))
                            {
                                identifiersWithUnmatchedDsoNames.Add(observationsIdentifier);
                            }

                            if (unmatchedDsoNamesInSection.ContainsKey(unmatchedDsoName))
                            {
                                continue;
                            }
                            if (foundUnmatchedDsoNames.Contains(unmatchedDsoName))
                            {
                                throw new ObsToolException("Save aborted. Unmatched DSO " + unmatchedDsoName + " found in more than one section of the report text!");
                            }

                            unmatchedDsoNamesInSection.Add(unmatchedDsoName, isNonDetectionDso);
                            Debug.WriteLine("Could not match name");
                            continue;
                        }
                        else
                        {
                            Debug.WriteLine("Found: " + dso.ToString());
                        }

                        if (foundDsoIds.Contains(dso.Id))
                        {
                            throw new ObsToolException("Save aborted. DSO " + dso.ToString() + " found in more than one section of the report text!");
                        }
                        if (dsosInSection.ContainsKey(dso.Id))
                        {
                            continue;  // ignore when the same object is mentioned more than one
                        }

                        dsosInSection.Add(dso.Id, dso);
                        nonDetectionDsosInSection[dso.Id] = isNonDetectionDso;

                        Debug.WriteLine("---------------------------------------------------------");
                    }

                    // Collect all the obs resources
                    MatchCollection resourceMatches = findResourcesRegexp.Matches(sectionText);  // matching on a single section
                    foreach (Match resourceMatch in resourceMatches)
                    {
                        string resourceType = resourceMatch.Groups[1].Value;
                        string resourceUrl = resourceMatch.Groups[2].Value;
                        Debug.WriteLine($"Match: {resourceType} {resourceUrl}");

                        bool isGoogleDriveUrl = (resourceType == "Sketch" || resourceType == "Jot");
                        string url = isGoogleDriveUrl ? GetFileIdFromGoogleDriveUrl(resourceUrl) : resourceUrl;

                        var obsResource = new ObsResource
                        {
                            UserId = obsSession.UserId,
                            Type = resourceType.Replace("Photo", "Image").ToLower(),
                            Url = url
                        };
                        obsResourcesInSection.Add(obsResource);
                    }

                    // Collect non-detection
                    bool sectionNonDetection = findNonDetectionRegexp.IsMatch(sectionText);

                    // Collect rating
                    int rating = 0;  // TODO: Change this to nullable and null?
                    if (findRatingRegexp.IsMatch(sectionText))
                    {
                        Match lastMatch = findRatingRegexp.Matches(sectionText).Last();
                        string ratingString = lastMatch.Groups[1].Value;
                        if (ratingString == "-1" || ratingString == "+1" || ratingString == "+2")
                        {
                            int.TryParse(ratingString, out rating);
                        }
                        else
                        {
                            rating = ratingString.Length;  // count number of *(stars)
                        }
                    }

                    // Collect follow-up
                    bool followUp = findFollowUpRegexp.IsMatch(sectionText);

                    // If section contained matches regex'ly but that could not be matched against anything
                    // in the DSO database
                    if (dsosInSection.Count == 0 && unmatchedDsoNamesInSection.Count == 0)
                    {
                        continue;
                    }

                    if (sectionNonDetection && (
                        nonDetectionDsosInSection.Values.Any(isNonDet => isNonDet)
                        || unmatchedDsoNamesInSection.Values.Any(isNonDet => isNonDet)))
                    {
                        throw new ObsToolException(
                            "A section is marked as a non-detection (!!) and also contains a DSO individually marked as a non-detection (!…!). Use one or the other.");
                    }

                    int numTargetsInSection = dsosInSection.Count + unmatchedDsoNamesInSection.Count;
                    bool allTargetsNonDetected =
                        numTargetsInSection > 0
                        && dsosInSection.Keys.All(id => nonDetectionDsosInSection.ContainsKey(id) && nonDetectionDsosInSection[id])
                        && unmatchedDsoNamesInSection.Values.All(isNonDet => isNonDet);
                    bool nonDetection = sectionNonDetection || allTargetsNonDetected;

                    // Add any ratings or follow up flags to the DSO's
                    foreach (Dso dso in dsosInSection.Values)
                    {
                        bool noExistingDsoExtra = (dso.DsoExtra == null);
                        if (noExistingDsoExtra)
                        {
                            dso.DsoExtra = new DsoExtra
                            {
                                UserId = obsSession.UserId,
                                DsoId = dso.Id,
                                Dso = dso
                            };
                            _dbContext?.DsoExtra.Add(dso.DsoExtra);
                        }
                        // If there is no existing DSO extra, or if this obs session is newer than the obs session used to store 
                        // the existing DSO extra, then we replace the attributes in it.
                        if (noExistingDsoExtra || (dso.DsoExtra != null && dso.DsoExtra.ObsSession != null && obsSession.Date >= dso.DsoExtra.ObsSession.Date))
                        {
                            dso.DsoExtra.ObsSession = obsSession;
                            dso.DsoExtra.Rating = rating;
                            dso.DsoExtra.FollowUp = followUp;
                        }
                    }

                    // Find any existing observations identifier based on the DSO objects the observation contains
                    if (string.IsNullOrEmpty(observationsIdentifier))
                    {
                        // If none was found in the section text, create one and remember it
                        observationsIdentifier = CreateNewObsIdentifier(
                            obsSession.Id,
                            dsosInSection.Values.ToList(),
                            unmatchedDsoNamesInSection.Keys.ToList());
                        newSectionMatchesDict.Add(sectionsMatch, observationsIdentifier);
                    }

                    // Now, create the observation!
                    Observation observation = new Observation
                    {
                        UserId = obsSession.UserId,
                        Text = sectionObsText,
                        Identifier = observationsIdentifier,
                        DsoObservations = new List<DsoObservation>(),
                        DisplayOrder = obsIndex++,
                        NonDetection = nonDetection,
                        InstrumentId = sectionInstrumentId
                    };

                    // Add all DSOs to the observation
                    int dsoObsIndex = 0;
                    foreach (Dso dso in dsosInSection.Values)
                    {
                        // Remember all the DSOs in this section for the checks in the next section, and the next etc..
                        foundDsoIds.Add(dso.Id);

                        var dsoObservation = new DsoObservation
                        {
                            Dso = dso,
                            DsoId = dso.Id,
                            DisplayOrder = dsoObsIndex++,
                            NonDetection = (nonDetectionDsosInSection.ContainsKey(dso.Id) && nonDetectionDsosInSection[dso.Id]) || sectionNonDetection
                            // no need to add observation.Id since it's just a POCO anyway ??????
                        };

                        // Add the DSOs as DsoObservation's to the observation
                        observation.DsoObservations.Add(dsoObservation);
                    }
                    foreach (string unmatchedDsoName in unmatchedDsoNamesInSection.Keys)
                    {
                        // Remember unresolved names too so their generated identifier cannot collide with another section.
                        foundUnmatchedDsoNames.Add(unmatchedDsoName);
                    }

                    // Add all obs resources to the observation
                    observation.ObsResources.AddRange(obsResourcesInSection);

                    // Save observation to be returned
                    observationsDict.Add(observation.Identifier, observation);
                }

                // Insert the identifier at the end of all new section matches in the report text.
                // Do it from back to front to keep the match indices from becoming obsolete when you add to the text.
                foreach (var sectionsMatch in sectionsMatches.Cast<Match>().Reverse())
                {
                    if (newSectionMatchesDict.ContainsKey(sectionsMatch))  // only the new ones
                    {
                        // Using the trimmed length to find the end position of the text to be replaced so that the
                        // inserted obs identifier doesn't end up two newlines below, at the start of the next section.
                        int trimmedLength = sectionsMatch.Value.Trim().Length;
                        int sectionEndPos = sectionsMatch.Index + trimmedLength;
                        string newObsIdentifier = newSectionMatchesDict[sectionsMatch];
                        string decoratedIdentifier = DecorateObsIdentifier(newObsIdentifier);
                        reportText = reportText.Replace(sectionEndPos, 0, decoratedIdentifier);
                    }
                }

                // Remove all obs resource links.
                // Do it from back to front to keep the match indices from becoming obsolete when you add to the text.
                MatchCollection globalResourceMatches = findResourcesRegexp.Matches(reportText);
                foreach (Match resourceMatch in globalResourceMatches.Cast<Match>().Reverse())
                {
                    reportText = reportText.Replace(resourceMatch.Index, resourceMatch.Length + 1, "");
                }
            }

            obsSession.ReportText = reportText;

            return observationsDict;
        }

        /// <summary>
        /// Finds all persisted observation identifiers that are still present in the report text.
        /// </summary>
        private ISet<string> FindExistingObsIdentifiers(string reportText)
        {
            var identifiers = new HashSet<string>();
            if (string.IsNullOrEmpty(reportText))
            {
                return identifiers;
            }

            MatchCollection matches = Regex.Matches(reportText, DecoratedObservationIdentifierPattern, RegexOptions.IgnoreCase);
            foreach (Match match in matches)
            {
                identifiers.Add(match.Groups[2].Value);
            }

            return identifiers;
        }

        private int? GetInstrumentIdForSection(int userId, int? defaultInstrumentId, List<Match> scopeMatches, int sectionStartIndex)
        {
            int? sectionInstrumentId = defaultInstrumentId;

            foreach (var scopeMatch in scopeMatches)
            {
                if (scopeMatch.Index > sectionStartIndex)
                {
                    break;
                }

                string scopeKey = scopeMatch.Groups[1].Value.Trim();
                if (string.IsNullOrWhiteSpace(scopeKey))
                {
                    sectionInstrumentId = null;
                    continue;
                }

                if (_instrumentsRepo == null)
                {
                    continue;
                }

                Instrument instrument = userId > 0
                    ? _instrumentsRepo.GetInstrumentByKey(scopeKey, userId)
                    : _instrumentsRepo.GetInstrumentByKey(scopeKey);
                if (instrument == null)
                {
                    throw new ObsToolException($"Unknown instrument key in scope directive: '{scopeKey}'");
                }
                sectionInstrumentId = instrument.Id;
            }

            return sectionInstrumentId;
        }

        private string FindExistingObsIdentifier(string sectionText)
        {
            Match match = Regex.Match(sectionText, DecoratedObservationIdentifierPattern, RegexOptions.IgnoreCase);
            if (match.Success)
            {
                return match.Groups[2].Value;
            }
            return string.Empty;
        }

        private string ReplaceDeprecatedObsIdentifiers(string sectionText)
        {
            // Just for test right now
            var deprecatedRegexes = new List<string> {
                @"\s(##(" + ObservationIdentifierPattern + @"))[\s\.$]?"
            };

            foreach (var deprecatedRegex in deprecatedRegexes)
            {
                sectionText = Regex.Replace(sectionText, deprecatedRegex, " #$2");
            }

            return sectionText;
        }

        private string GetFileIdFromGoogleDriveUrl(string url)
        {
            if (url.StartsWith("https://drive.google.com"))  // preemtive optimization
            {
                // Matches links like https://drive.google.com/open?id=1nze1eHCrwMMKVV6_ZR5iCRsV_FvhYFMw
                Match match = Regex.Match(url, @"https:\/\/drive\.google\.com\/open\?id=(.*)", RegexOptions.IgnoreCase);
                if (match.Success)
                {
                    return match.Groups[1].Value;
                }

                // Matches links like https://drive.google.com/file/d/1nze1eHCrwMMKVV6_ZR5iCRsV_FvhYFMw/view?usp=sharing
                match = Regex.Match(url, @"https:\/\/drive\.google\.com\/file\/d\/(.*)\/view.*", RegexOptions.IgnoreCase);
                if (match.Success)
                {
                    return match.Groups[1].Value;
                }
            }
            return url;
        }

        private string CreateNewObsIdentifier(int obsSessionId, List<Dso> dsoList, List<string> unmatchedDsoNames)
        {
            // Keep identifiers deterministic so the same section round-trips even when objects are mentioned in a different order.
            var identifierParts = new List<string> { obsSessionId.ToString() };
            identifierParts.AddRange(dsoList.OrderBy(d => d.Id).Select(d => d.Id.ToString()));
            identifierParts.AddRange(unmatchedDsoNames.OrderBy(name => name).Select(name => $"!{name}!"));
            return string.Join("-", identifierParts);
        }

        private string DecorateObsIdentifier(string bareIdentifier)
        {
            return "\n#" + bareIdentifier;
        }

        private string GetPartBeforeFirstNewlineIfAny(string text)
        {
            int indexOfNewline = text.IndexOf("\n");
            return indexOfNewline == -1 ? text : text.Substring(0, indexOfNewline);
        }

        private string NormalizeUnmatchedDsoName(string dsoName)
        {
            // Unmatched object tokens live inside the hidden identifier, so restrict them to stable ASCII letters and digits.
            string withoutSpaces = Regex.Replace(dsoName, @"\s+", "");
            string normalized = Regex.Replace(withoutSpaces, @"[^A-Za-z0-9]", "");
            return normalized.ToUpperInvariant();
        }

        /// <summary>
        /// Returns the catalog spelling used by the database even when the report text uses different casing.
        /// </summary>
        private string GetCanonicalCatalogName(string catalog, IEnumerable<string> allCatalogs)
        {
            // Regex matching is case-insensitive, but DSO lookup is exact when parsing report text.
            return allCatalogs.FirstOrDefault(c => string.Equals(c, catalog, StringComparison.OrdinalIgnoreCase)) ?? catalog;
        }

        public bool SaveChanges()
        {
            bool success = true;
            try
            {
                _dbContext.SaveChanges();
            }
            catch (DbUpdateException)
            {
                throw;
            }
            return success;
        }
    }
}
