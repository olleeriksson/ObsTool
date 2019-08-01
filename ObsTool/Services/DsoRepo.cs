using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ObsTool.Entities;

namespace ObsTool.Services
{
    public class DsoRepo : IDsoRepo
    {
        private MainDbContext _dbContext;

        public DsoRepo(MainDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public ICollection<Dso> GetMultipleDsoByIds(ICollection<int> dsoIds)
        {
            ICollection<Dso> foundDso = null;

            var dsoExtras = _dbContext.DsoExtra.Include(x => x.Dso).ToList();

            // Look for the normalized name in Name and OtherNames
            foundDso = _dbContext.Dso
                .Where(dso => dsoIds.Contains(dso.Id))
                .Include(dso => dso.DsoExtra)
                .ToList();

            return foundDso;
        }

        public ICollection<Dso> GetMultipleDsoByQueryString(string queryString, bool normalize = true)
        {
            // Normalize if needed
            string normalizedQueryString = normalize ? normalizeDsoString(queryString) : queryString;

            ICollection<Dso> foundDso = null;

            // Look for the normalized name in Name and OtherNames
            foundDso = _dbContext.Dso.Where(dso => 
                dso.Name.Contains(normalizedQueryString) ||
                dso.OtherNames.Contains(normalizedQueryString) ||
                dso.CommonName.Contains(queryString)
                )
                .Include(dso => dso.DsoExtra)
                .ToList();

            //// If not found, look for the query string in CommonName and AllCommonNames
            //if (foundDso == null)
            //{
            //    foundDso = _dbContext.Dso.FirstOrDefault(dso => dso.CommonName == queryString || dso.AllCommonNames.Contains(queryString));
            //}

            return foundDso;
        }

        public Dso GetDsoById(int id)
        {
            return _dbContext.Dso.FirstOrDefault(dso => dso.Id == id); 
        }

        public Dso GetDsoByName(string nameString, bool normalize = true)
        {
            // Normalize if needed
            string normalizedName = normalize ? normalizeDsoString(nameString) : nameString;

            Dso foundDso = null;

            // Look for a perfect match with the normalized name
            foundDso = _dbContext.Dso.Include(dso => dso.DsoExtra).FirstOrDefault(dso => dso.Name == normalizedName);
            if (foundDso != null)
            {
                return foundDso;
            }

            // If no perfect match was found, look for other names that contain this name
            foundDso = _dbContext.Dso.Include(dso => dso.DsoExtra).FirstOrDefault(dso => dso.OtherNames.Contains(normalizedName));
            if (foundDso != null)
            {
                return foundDso;
            }

            // If not found, look for the query string in CommonName and AllCommonNames
            if (foundDso == null)
            {
                foundDso = _dbContext.Dso.Include(dso => dso.DsoExtra).FirstOrDefault(dso => dso.CommonName == nameString || dso.AllCommonNames.Contains(nameString));
            }

            return foundDso;
        }

        public Dso GetDsoByNumber(string catalogNo)
        {
            return _dbContext.Dso.Include(dso => dso.DsoExtra).FirstOrDefault(dso => dso.CatalogNumber == catalogNo);
        }

        public int GetNumDsoInDatabase()
        {
            return _dbContext.Dso.Count();
        }

        public DsoExtra GetDsoExtraById(int id)
        {
            return _dbContext.DsoExtra.FirstOrDefault(dsoExtra => dsoExtra.Id == id);
        }


        private string normalizeDsoString(string queryString)
        {
            //var regex = new Regex(@"([a-zA-Z]+)(\ |-)?(([0-9]+[+-.]*)*[0-9]*)");
            var regex = new Regex(@"([a-zA-Z]+)(\ |-)?([0-9]+([+-.]?[0-9]+)*)");
            if (regex.IsMatch(queryString))
            {
                MatchCollection matches = regex.Matches(queryString);
                foreach (Match match in matches)
                {
                    string catalog = match.Groups[1].Value;
                    string catalogNo = match.Groups[3].Value;
                    string lookupName = catalog + " " + catalogNo;
                    return lookupName;
                }
            }
            return queryString;
        }

        public ICollection<string> GetAllCatalogs()
        {
            return _dbContext.Dso
                .Where(dso => dso.Catalog != "")  // had to be added after I added the custom object with empty catalog
                .Select(dso => dso.Catalog)
                .Distinct()
                .ToList();
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
