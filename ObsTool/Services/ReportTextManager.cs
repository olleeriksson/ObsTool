
using ObsTool.Entities;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace ObsTool.Services
{
    public class ReportTextManager
    {
        private MainDbContext _dbContext;
        private ObservationsRepo _observationsRepo;
        private DsoRepo _dsoRepo;

        public ReportTextManager(MainDbContext dbContext, ObservationsRepo observationsRepo, DsoRepo dsoRepo)
        {
            _dbContext = dbContext;
            _observationsRepo = observationsRepo;
            _dsoRepo = dsoRepo;
        }

        public void DisplayName() => Console.WriteLine(ToString());

        public string RegExpJoinCatalogs(IEnumerable<string> catalogs) => string.Join("|", catalogs);

        public void Parse(ObsSession obsSession)
        {
            // Parse
            var newObservations = ParseAndPrint(obsSession.ReportText);

            // Replace list of Observations on the ObsSession
            _dbContext.Entry(obsSession).Collection("Observations").Load();
            obsSession.Observations.RemoveAll(obs => true);
            obsSession.Observations.AddRange(newObservations);
            SaveChanges();
        }

        private ICollection<Observation> ParseAndPrint(string reportText)
        {
            IDictionary<int, Observation> observationsDictionary = new Dictionary<int, Observation>();

            // If report text is empty, just return
            if (reportText == null)
            {
                return observationsDictionary.Values.ToList<Observation>();
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

                        Debug.WriteLine("---------------------------------------------------------");
                        Debug.WriteLine($"Match: {catalog} {catalogNo}");
                        Debug.WriteLine($"Match: {sectionText}");

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
                                Dso = dso
                            };
                            observationsDictionary.Add(dso.Id, observation);
                        }
                    }
                }
            }
            return observationsDictionary.Values.ToList<Observation>();
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
