
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
            IDictionary<int, Observation> updatedObservations = Parse(obsSession.ReportText);

            // Replace list of Observations on the ObsSession
            _dbContext.Entry(obsSession).Collection("Observations").Load();

            List<Observation> observationsToDelete = obsSession.Observations
                .Where(oldObs => !updatedObservations.ContainsKey(oldObs.DsoId))  // those where there is (not any/no) match in the updatedObservations list
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
                // Then delete them
                Debug.WriteLine("Deleting observation for DSO " + (observationToDelete.Dso != null ? observationToDelete.Dso.Name : "" + observationToDelete.DsoId));
                obsSession.Observations.Remove(observationToDelete);
            }

            // First off, start by creating a dictionary of the existing observations for easier lookup
            IDictionary<int, Observation> existingObservations = new Dictionary<int, Observation>();
            foreach (Observation existingObservation in obsSession.Observations)
            {
                existingObservations.Add(existingObservation.DsoId, existingObservation);
            }

            // Now, go through observations that already existed, and that should be updated with the new data
            foreach (Observation existingObservation in obsSession.Observations)
            {
                if (updatedObservations.ContainsKey(existingObservation.DsoId))
                {
                    Observation updatedObservation = updatedObservations[existingObservation.DsoId];
                    Debug.WriteLine("Updating text for existing observation for DSO " + updatedObservation.Dso.Name);
                    // Transfer/update the report text
                    existingObservation.Text = updatedObservation.Text;
                }

            }

            // Finally, add those observations that are new, that didn't exist before
            foreach (Observation updatedObservation in updatedObservations.Values)
            {
                if (!existingObservations.ContainsKey(updatedObservation.DsoId))  // it doesn't exists, add it!
                {
                    var newObservation = updatedObservation;  // just to clearly indicate that it's a new one
                    Debug.WriteLine("Adding new observation for DSO " + newObservation.Dso.Name);
                    obsSession.Observations.Add(newObservation);
                }
            }

            SaveChanges();
        }

        private IDictionary<int, Observation> Parse(string reportText)
        {
            IDictionary<int, Observation> observationsDictionary = new Dictionary<int, Observation>();

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
            string dsoNameRegexp = "(" + regexpAllCatalogs + @")[\ |-]?([0-9]+([+-.]?[0-9]+)*)";
            var findDsoNamesRegexp = new Regex(dsoNameRegexp, RegexOptions.IgnoreCase);

            // Regexp for finding text sections that include DSO names
            var findSectionsRegexp = new Regex(".*" + dsoNameRegexp + ".*", RegexOptions.IgnoreCase);

            if (findSectionsRegexp.IsMatch(reportText))  // matches anywhere
            {
                MatchCollection sectionsMatches = findSectionsRegexp.Matches(reportText);  // matching on the whole report text
                foreach (Match sectionsMatch in sectionsMatches)
                {
                    string sectionText = sectionsMatch.Value;

                    MatchCollection dsoNameMatches = findDsoNamesRegexp.Matches(sectionText);  // matching on a single section
                    foreach (Match dsoNameMatch in dsoNameMatches)
                    {
                        string catalog = dsoNameMatch.Groups[1].Value;
                        string catalogNo = dsoNameMatch.Groups[2].Value;

                        //Debug.WriteLine("---------------------------------------------------------");
                        //Debug.WriteLine($"Match: {catalog} {catalogNo}");
                        //Debug.WriteLine($"Match: {sectionText}");

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
                        Debug.WriteLine("---------------------------------------------------------");

                        if (!observationsDictionary.ContainsKey(dso.Id))
                        {
                            Observation observation = new Observation
                            {
                                Text = sectionText,
                                Dso = dso,
                                DsoId = dso.Id
                            };
                            observationsDictionary.Add(dso.Id, observation);
                        }
                    }
                }
            }
            return observationsDictionary;
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
