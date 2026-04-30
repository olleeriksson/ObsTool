using System.Collections.Generic;
using ObsTool.Entities;

namespace ObsTool.Services
{
    public interface IInstrumentsRepo
    {
        Instrument AddInstrument(Instrument instrument);
        Instrument GetInstrument(int id);
        Instrument GetInstrumentByKey(string key);
        IEnumerable<Instrument> GetInstruments();
        bool DeleteInstrument(Instrument instrument);
        bool AnyObservationReferences(int instrumentId);
        bool AnyObsSessionReferences(int instrumentId);
        bool SaveChanges();
    }
}
