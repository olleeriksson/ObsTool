using ObsTool.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ObsTool.Services
{
    public interface IObsSessionsRepository
    {
        IEnumerable<ObsSession> GetObsSessions(bool includeLocation = false, bool includeReportText = false);
        ICollection<ObsSession> GetObsSessionsByMultipleIds(IList<int> ids);
        ObsSession GetObsSession(int id);
        ObsSession GetObsSession(int id, bool includeLocation = false, bool includeObservations = false, bool includeDso = false);
        int GetNumObsSessions();
        ObsSession AddObsSession(ObsSession obsSession);
        bool DeleteObsSession(ObsSession obsSession);
        bool SaveChanges();
    }
}
