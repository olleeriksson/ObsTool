
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
        private MainDbContext _dbContext;
        private ObservationsRepo _observationsRepo;
        private DsoRepo _dsoRepo;
        private ILogger<ReportTextManager> _logger;

        public ReportTextManager(MainDbContext dbContext, ObservationsRepo observationsRepo, DsoRepo dsoRepo, ILogger<ReportTextManager> logger)
        {
            _dbContext = dbContext;
            _observationsRepo = observationsRepo;
            _dsoRepo = dsoRepo;
            _logger = logger;
        }

        public void DisplayName() => Console.WriteLine(ToString());

        public string RegExpJoinCatalogs(IEnumerable<string> catalogs) => string.Join("|", catalogs);

        public void ParseAndStoreObservations(ObsSession obsSession)
        {
            // Parse
            IDictionary<string, Observation> updatedObservations = Parse(obsSession.ReportText);

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
                //observationToDelete.DsoObservations.RemoveAll(dsoObs => true);  // doesn't seem needed, just loading them

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

            // Now, go through observations that already existed, and that should be updated with the new data
            foreach (Observation existingObservation in obsSession.Observations)
            {
                if (updatedObservations.ContainsKey(existingObservation.Identifier))
                {
                    Observation updatedObservation = updatedObservations[existingObservation.Identifier];
                    Debug.WriteLine("Updating the existing observation for observation with Identifier " + updatedObservation.Identifier);
                    // Transfer/update the observation
                    existingObservation.Text = updatedObservation.Text;
                    existingObservation.DisplayOrder = updatedObservation.DisplayOrder;
                }
            }

            // Finally, add those observations that are new, that didn't exist before
            foreach (Observation updatedObservation in updatedObservations.Values)
            {
                if (!existingObservations.ContainsKey(updatedObservation.Identifier))  // it doesn't exists, add it!
                {
                    var newObservation = updatedObservation;  // just to clearly indicate that it's a new one
                    Debug.WriteLine("Adding new observation for observation with Identifier " + newObservation.Identifier);
                    obsSession.Observations.Add(newObservation);
                }
            }

            SaveChanges();
        }

        private IDictionary<string, Observation> Parse(string reportText)
        {
            IDictionary<string, Observation> observationsDictionary = new Dictionary<string, Observation>();

            // If report text is empty, just return
            if (reportText == null)
            {
                return observationsDictionary;
            }

            //string[] primaryCatalogs = { "M", "NGC", "IC", "Sh", "UGC", "PGC" };

            // Get a list of all catalogs designators to search for
            var allCatalogs = _dsoRepo.GetAllCatalogs();
            allCatalogs.Add("Sh2");

            // Regexp for finding DSO names
            string regexpAllCatalogs = RegExpJoinCatalogs(allCatalogs);
            string startingParenthesisRegexp = @"(\()?";
            string endingParenthesisRegexp = @"(\))?";
            // The ?: at the start of one of the groups is to make that the group is non-capturing.
            // This results in the fourth group always beeing the ending parenthesis.
            string dsoNameRegexp = startingParenthesisRegexp + "(" + regexpAllCatalogs + @")[\ |-]?([0-9]+(?:[+-.]?[0-9]+)*)" + endingParenthesisRegexp;
            var findDsoNamesRegexp = new Regex(dsoNameRegexp, RegexOptions.IgnoreCase);

            // Regexp for finding text sections that include DSO names
            var findSectionsRegexp = new Regex(".*" + dsoNameRegexp + ".*", RegexOptions.IgnoreCase);



            if (findSectionsRegexp.IsMatch(reportText))  // matches anywhere
            {
                int matchNo = 0;
                ISet<int> foundDsoIds = new HashSet<int>();

                MatchCollection sectionsMatches = findSectionsRegexp.Matches(reportText);  // matching on the whole report text
                foreach (Match sectionsMatch in sectionsMatches)
                {
                    string sectionText = sectionsMatch.Value;
                    var dsosInSection = new List<Dso>();

                    MatchCollection dsoNameMatches = findDsoNamesRegexp.Matches(sectionText);  // matching on a single section
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
                        if (startingParenthesis == "(" && endingParenthesis == ")") {
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
                            throw new Exception("DSO " + dso.ToString() + " found in more than one section of the report text!");
                        }

                        dsosInSection.Add(dso);

                        Debug.WriteLine("---------------------------------------------------------");
                    }

                    // Create observations identifier based on the DSO objects the observation contains
                    var observationsIdentifier = CreateDsoObservationsIdentifier(dsosInSection);

                    // Now, create the observation!
                    Observation observation = new Observation
                    {
                        Text = sectionText,
                        Identifier = observationsIdentifier,
                        DsoObservations = new List<DsoObservation>(),
                        DisplayOrder = matchNo++
                    };

                    // Then add all DSOs to the observation
                    foreach (Dso dso in dsosInSection)
                    {
                        // Remember all the DSOs in this section for the checks in the next section, and the next etc..
                        foundDsoIds.Add(dso.Id);

                        // Add the DSOs as DsoObservation's to the observation
                        observation.DsoObservations.Add(new DsoObservation { Dso = dso });
                    }

                    observationsDictionary.Add(observation.Identifier, observation);
                }
            }
            return observationsDictionary;
        }

        public string CreateDsoObservationsIdentifier(List<Dso> dsoList)
        {
            return string.Join(",", dsoList.OrderBy(d => d.Name).Select(d => d.Name));
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
