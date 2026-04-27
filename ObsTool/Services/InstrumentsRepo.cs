using System.Collections.Generic;
using System.Linq;
using ObsTool.Database;
using ObsTool.Entities;

namespace ObsTool.Services
{
    public class InstrumentsRepo
    {
        private MainDbContext _dbContext;

        public InstrumentsRepo(MainDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public Instrument AddInstrument(Instrument instrument)
        {
            var added = _dbContext.Instruments.Add(instrument);
            _dbContext.SaveChanges();
            return added.Entity;
        }

        public Instrument GetInstrument(int id)
        {
            return _dbContext.Instruments.FirstOrDefault(i => i.Id == id);
        }

        public IEnumerable<Instrument> GetInstruments()
        {
            return _dbContext.Instruments.ToList();
        }

        public bool DeleteInstrument(Instrument instrument)
        {
            _dbContext.Instruments.Remove(instrument);
            return (_dbContext.SaveChanges() > 0);
        }

        public bool AnyObservationReferences(int instrumentId)
        {
            return _dbContext.Observations.Any(o => o.InstrumentId == instrumentId);
        }

        public bool SaveChanges()
        {
            return (_dbContext.SaveChanges() > 0);
        }
    }
}
