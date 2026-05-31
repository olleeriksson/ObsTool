using System.Collections.Generic;
using ObsTool.Entities;

namespace ObsTool.Services
{
    public interface IInstrumentsRepo
    {
        Instrument AddInstrument(Instrument instrument, int userId);
        Instrument GetInstrument(int id);
        Instrument GetInstrument(int id, int userId);
        Instrument GetInstrumentByKey(string key);
        Instrument GetInstrumentByKey(string key, int userId);
        IEnumerable<Instrument> GetInstruments();
        IEnumerable<Instrument> GetInstruments(int userId);
        bool DeleteInstrument(Instrument instrument);
        int GetNumObservationsForInstrument(int instrumentId, int userId);
        int GetNumObsSessionsForInstrument(int instrumentId, int userId);
        IReadOnlyDictionary<int, int> GetObservationReferenceCounts(int userId);
        IReadOnlyDictionary<int, int> GetObsSessionReferenceCounts(int userId);
        bool AnyObservationReferences(int instrumentId);
        bool AnyObservationReferences(int instrumentId, int userId);
        bool AnyObsSessionReferences(int instrumentId);
        bool AnyObsSessionReferences(int instrumentId, int userId);
        bool SaveChanges();
    }
}
