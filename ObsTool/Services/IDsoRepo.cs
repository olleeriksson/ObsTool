using System.Collections.Generic;
using ObsTool.Entities;

namespace ObsTool.Services
{
    public interface IDsoRepo
    {
        ICollection<string> GetAllCatalogs();
        Dso GetDsoById(int id);
        Dso GetDsoById(int id, int userId);
        Dso GetDsoByName(string nameString, bool normalize = true);
        Dso GetDsoByName(string nameString, bool normalize, int userId);
        Dso GetDsoByNumber(string catalogNo);
        Dso GetDsoByNumber(string catalogNo, int userId);
        DsoExtra GetDsoExtraById(int id);
        DsoExtra GetDsoExtraById(int id, int userId);
        ICollection<Dso> GetMultipleDsoByIds(List<int> dsoIds);
        ICollection<Dso> GetMultipleDsoByIds(List<int> dsoIds, int userId);
        ICollection<Dso> GetMultipleDsoByQueryString(string queryString, bool normalize = true);
        ICollection<Dso> GetMultipleDsoByQueryString(string queryString, bool normalize, int userId);
        int GetNumDsoInDatabase();
        bool SaveChanges();
    }
}
