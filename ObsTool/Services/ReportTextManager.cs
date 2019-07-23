
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

namespace ObsTool.Services
{
    public class ReportTextManager
    {
        private Entities.MainDbContext _dbContext;
        private ObservationsRepo _observationsRepo;
        private DsoRepo _dsoRepo;
        private ILogger<ReportTextManager> _logger;
        private DsoObservationsRepo _dsoObservationsRepo;

        public ReportTextManager(Entities.MainDbContext dbContext, ObservationsRepo observationsRepo, DsoRepo dsoRepo,
            ILogger<ReportTextManager> logger, DsoObservationsRepo dsoObservationsRepo)
        {
            _dbContext = dbContext;
            _observationsRepo = observationsRepo;
            _dsoRepo = dsoRepo;
            _logger = logger;
            _dsoObservationsRepo = dsoObservationsRepo;
        }

        public void DisplayName() => Console.WriteLine(ToString());

        public string RegExpJoinCatalogs(IEnumerable<string> catalogs) => string.Join("|", catalogs);

        public void ParseAndStoreObservations(ObsSession obsSession)
        {
            // Parse
            IDictionary<string, Observation> updatedObservations = Parse(obsSession);
            // All returned observations are to be either updated or added, that is decided further down
            // by looking at the currently stored observations.

            // Replace list of Observations on the ObsSession
            _dbContext.Entry(obsSession).Collection("Observations").Load();

            List<Observation> observationsToDelete = obsSession.Observations
                .Where(oldObs => !updatedObservations.ContainsKey(oldObs.Identifier))  // those where there is (not any/no) match in the updatedObservations list
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
                existingObservations.Add(existingObservation.Identifier, existingObservation);
            }

            // Then go through observations that already existed, and that should be updated with the new data
            foreach (Observation existingObservation in obsSession.Observations)
            {
                if (updatedObservations.ContainsKey(existingObservation.Identifier))
                {
                    Observation updatedObservation = updatedObservations[existingObservation.Identifier];

                    // Transfer/update the observation
                    existingObservation.Text = updatedObservation.Text;
                    existingObservation.DisplayOrder = updatedObservation.DisplayOrder;
                    existingObservation.NonDetection = updatedObservation.NonDetection;

                    _dbContext.Entry(existingObservation).Collection("DsoObservations").Load();
                    _dbContext.Entry(existingObservation).Collection("ObsResources").Load();

                    // Set the existing observation id or we get duplicate errors etc when persisting.
                    // During the Parse() stage above we are not aware of the existing observations' ids.
                    foreach (DsoObservation dsoObservation in updatedObservation.DsoObservations)
                    {
                        dsoObservation.ObservationId = existingObservation.Id;
                    }

                    UpdateDsoObservations(existingObservation, updatedObservation);
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
        /// Updates the existing list of DsoObservations for the current Observation with
        /// a new list of DsoObservations, which might contain new, some updated, and some removed.
        /// </summary>
        private void UpdateDsoObservations(Observation existingObservation, Observation updatedObservation)
        {
            List<DsoObservation> existingDsoObservations = existingObservation.DsoObservations;
            List<DsoObservation> updatedDsoObservations = updatedObservation.DsoObservations;

            // Remove all DsoObservations that aren't in the updatedObservation
            var toRemove = new List<DsoObservation>();
            foreach (DsoObservation existingDsoObservation in existingDsoObservations)
            {
                if (!updatedDsoObservations.Contains(existingDsoObservation))
                {
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
                    // Get the existing one and update it (only DisplayOrder as of now)
                    var existingDsoObservation = existingDsoObservations.Find(i => i.Equals(newDsoObservation));  // compares the PK ids
                    existingDsoObservation.DisplayOrder = newDsoObservation.DisplayOrder;
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
                    existingObsResources.Add(newObsResource);
                }
            }
        }

        private IDictionary<string, Observation> Parse(ObsSession obsSession)
        {
            string reportText = obsSession.ReportText;
            IDictionary<string, Observation> observationsDict = new Dictionary<string, Observation>();
            IDictionary<Match, string> newSectionMatchesDict = new Dictionary<Match, string>();

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
            string introRegexp = @"\s*";
            string startingParenthesisRegexp = @"(\()?";
            string endingParenthesisRegexp = @"(\))?";
            string outroRegexp = @"[\s\.,]";
            // The ?: at the start of one of the groups is to make that the group is non-capturing.
            // This results in the fourth group always beeing the ending parenthesis.
            string dsoNameRegexp = introRegexp
                + startingParenthesisRegexp
                + "(" + regexpAllCatalogs + @")[\ |-]?([0-9]+(?:[+-\.]?[0-9]+)*)"
                + endingParenthesisRegexp
                + outroRegexp;
            var findDsoNamesRegexp = new Regex(dsoNameRegexp, RegexOptions.Compiled | RegexOptions.IgnoreCase);

            // Regexp for finding text sections that include DSO names
            string sectionStart = @"[^\n]*";  // the ? after the * makes it non-greedy, or else it doesn't stop at the first section end in singleline (all text as one string) mode
            string sectionEnding = @".*?(?:\n\n|\n$|$)";  // a section can end with \n\n, or \n$, or just $. The ?: after the parenthesis makes the group non-capturing.
            string findSectionRegexp = sectionStart
                + dsoNameRegexp
                + sectionEnding;
            // The RegexOptions.Singleline below is what makes it find sections that include a newline and then a Photo:/Link:/Sketch: tag.
            // It also makes it necessary to use a ? in .*? to make it non-greedy.
            var findSectionsRegexp = new Regex(findSectionRegexp,
                RegexOptions.Compiled | RegexOptions.IgnoreCase | RegexOptions.Singleline);

            string resourceRegexp = @"(Link|Image|Photo|Sketch):\s?(.*)";
            var findResourcesRegexp = new Regex(resourceRegexp, RegexOptions.Compiled | RegexOptions.IgnoreCase);

            string flagOutro = @"(?:\s|\.|$)";  // non-capturing group of \s or . or $

            string nonDetectionRegexp = @"\s!!" + flagOutro;
            var findNonDetectionRegexp = new Regex(nonDetectionRegexp, RegexOptions.Compiled | RegexOptions.IgnoreCase);

            string ratingRegexp = @"\s(-1|\+1|\+2|\*|\*\*)" + flagOutro;
            var findRatingRegexp = new Regex(ratingRegexp, RegexOptions.Compiled | RegexOptions.IgnoreCase);

            string followUpRegexp = @"\s(re-?visit|come back|telescope)" + flagOutro;
            var findFollowUpRegexp = new Regex(followUpRegexp, RegexOptions.Compiled | RegexOptions.IgnoreCase);

            if (findSectionsRegexp.IsMatch(reportText))  // matches anywhere
            {
                int obsIndex = 0;
                ISet<int> foundDsoIds = new HashSet<int>();

                MatchCollection sectionsMatches = findSectionsRegexp.Matches(reportText);  // matching on the whole report text
                foreach (Match sectionsMatch in sectionsMatches)
                {
                    string sectionText = sectionsMatch.Value;  // the whole section, including resource links

                    string sectionObsText = GetPartBeforeFirstNewlineIfAny(sectionText);
                    var dsosInSection = new Dictionary<int, Dso>();
                    var obsResourcesInSection = new List<ObsResource>();

                    // Collect all the DSO's in the section text.
                    MatchCollection dsoNameMatches = findDsoNamesRegexp.Matches(sectionObsText);  // matching on a single section
                    foreach (Match dsoNameMatch in dsoNameMatches)
                    {
                        string startingParenthesis = dsoNameMatch.Groups[1].Value;
                        string catalog = dsoNameMatch.Groups[2].Value;
                        string catalogNo = dsoNameMatch.Groups[3].Value;
                        string endingParenthesis = dsoNameMatch.Groups[4].Value;

                        Debug.WriteLine("---------------------------------------------------------");
                        Debug.WriteLine($"Match: {catalog} {catalogNo}");
                        //Debug.WriteLine($"Match: {sectionText}");

                        // Ignore pattern if it's surrounded by parenthesis
                        if (startingParenthesis == "(" || endingParenthesis == ")")
                        {
                            continue;
                        }

                        string dsoName = $"{catalog} {catalogNo}";
                        Dso dso = _dsoRepo.GetDsoByName(dsoName, normalize: false);

                        if (dso == null)
                        {
                            Debug.WriteLine("Could not match name");
                            continue;
                        }
                        else
                        {
                            Debug.WriteLine("Found: " + dso.ToString());
                        }

                        if (foundDsoIds.Contains(dso.Id))
                        {
                            throw new ObsToolException("DSO " + dso.ToString() + " found in more than one section of the report text!");
                        }
                        if (dsosInSection.ContainsKey(dso.Id))
                        {
                            continue;  // ignore when the same object is mentioned more than one
                        }

                        dsosInSection.Add(dso.Id, dso);

                        Debug.WriteLine("---------------------------------------------------------");
                    }

                    // Collect all the obs resources
                    MatchCollection resourceMatches = findResourcesRegexp.Matches(sectionText);  // matching on a single section
                    foreach (Match resourceMatch in resourceMatches)
                    {
                        string resourceType = resourceMatch.Groups[1].Value;
                        string resourceUrl = resourceMatch.Groups[2].Value;
                        Debug.WriteLine($"Match: {resourceType} {resourceUrl}");

                        var obsResource = new ObsResource
                        {
                            Type = resourceType.Replace("Photo", "Image").ToLower(),
                            Url = resourceUrl
                        };
                        obsResourcesInSection.Add(obsResource);
                    }

                    // Collect non-detection
                    bool nonDetection = findNonDetectionRegexp.IsMatch(sectionText);

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
                    if (dsosInSection.Count == 0)
                    {
                        continue;
                    }

                    // Add any ratings or follow up flags to the DSO's
                    foreach (Dso dso in dsosInSection.Values)
                    {
                        bool noExistingDsoExtra = (dso.DsoExtra == null);
                        if (noExistingDsoExtra)
                        {
                            dso.DsoExtra = new DsoExtra();
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

                    string replacedDeprectedIdentifiers = ReplaceDeprecatedObsIdentifiers(sectionText);

                    // Find any existing observations identifier based on the DSO objects the observation contains
                    var observationsIdentifier = FindExistingObsIdentifier(sectionText);
                    if (string.IsNullOrEmpty(observationsIdentifier))
                    {
                        // If none was found in the section text, create one and remember it
                        observationsIdentifier = CreateNewObsIdentifier(obsSession.Id, dsosInSection.Values.ToList());
                        newSectionMatchesDict.Add(sectionsMatch, observationsIdentifier);
                    }

                    // Now, create the observation!
                    Observation observation = new Observation
                    {
                        Text = sectionObsText,
                        Identifier = observationsIdentifier,
                        DsoObservations = new List<DsoObservation>(),
                        DisplayOrder = obsIndex++,
                        NonDetection = nonDetection
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
                            DisplayOrder = dsoObsIndex++
                            // no need to add observation.Id since it's just a POCO anyway ??????
                        };

                        // Add the DSOs as DsoObservation's to the observation
                        observation.DsoObservations.Add(dsoObservation);
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

        private string FindExistingObsIdentifier(string sectionText)
        {
            Match match = Regex.Match(sectionText, @"\s(#(\d*(-\d+)*))[\s\.$]?", RegexOptions.IgnoreCase);
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
                @"\s(##(\d*(-\d+)*))[\s\.$]?"
            };

            foreach (var deprecatedRegex in deprecatedRegexes)
            {
                sectionText = Regex.Replace(sectionText, deprecatedRegex, " #$2");
            }

            return sectionText;
        }

        private string CreateNewObsIdentifier(int obsSessionId, List<Dso> dsoList)
        {
            //var result = Guid.NewGuid();
            string dsoIds = string.Join("-", dsoList.OrderBy(d => d.Id).Select(d => d.Id));
            string full = obsSessionId + "-" + dsoIds;
            return full.Replace(" ", "");
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
