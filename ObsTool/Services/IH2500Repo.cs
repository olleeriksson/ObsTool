using System.Collections.Generic;
using ObsTool.Entities;

namespace ObsTool.Services
{
    public interface IH2500Repo
    {
        H2500 GetH2500Object(int herschelId);
        H2500 GetH2500ObjectByCatalog(string catalog, int catalogNumber);
        IEnumerable<H2500> GetH2500Objects();
        IEnumerable<H2500> GetH2500ObjectsByDsoId(int dsoId);
        IEnumerable<H2500> GetObservedH2500Objects(bool includeNonDetections = true);
    }
}
