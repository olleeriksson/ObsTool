using System.Collections.Generic;
using ObsTool.Entities;

namespace ObsTool.Services
{
    public interface IDsoRepo
    {
        ICollection<string> GetAllCatalogs();
        Dso GetDsoById(int id);
        Dso GetDsoByName(string nameString, bool normalize = true);
        Dso GetDsoByNumber(string catalogNo);
        DsoExtra GetDsoExtraById(int id);
        ICollection<Dso> GetMultipleDsoByIds(List<int> dsoIds);
        ICollection<Dso> GetMultipleDsoByQueryString(string queryString, bool normalize = true);
        int GetNumDsoInDatabase();
        bool SaveChanges();
    }
}