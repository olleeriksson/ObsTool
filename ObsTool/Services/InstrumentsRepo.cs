using System.Collections.Generic;
using System.Linq;
using ObsTool.Database;
using ObsTool.Entities;

namespace ObsTool.Services
{
    public class InstrumentsRepo : IInstrumentsRepo
    {
        private MainDbContext _dbContext;

        public InstrumentsRepo(MainDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public Instrument AddInstrument(Instrument instrument, int userId)
        {
            instrument.UserId = userId;
            var added = _dbContext.Instruments.Add(instrument);
            _dbContext.SaveChanges();
            return added.Entity;
        }

        public Instrument GetInstrument(int id)
        {
            return _dbContext.Instruments.FirstOrDefault(i => i.Id == id);
        }

        public Instrument GetInstrument(int id, int userId)
        {
            return _dbContext.Instruments.FirstOrDefault(i => i.Id == id && i.UserId == userId);
        }

        public Instrument GetInstrumentByKey(string key)
        {
            return _dbContext.Instruments.FirstOrDefault(i => i.Key == key);
        }

        public Instrument GetInstrumentByKey(string key, int userId)
        {
            return _dbContext.Instruments.FirstOrDefault(i => i.Key == key && i.UserId == userId);
        }

        public IEnumerable<Instrument> GetInstruments()
        {
            return _dbContext.Instruments.ToList();
        }

        public IEnumerable<Instrument> GetInstruments(int userId)
        {
            return _dbContext.Instruments.Where(i => i.UserId == userId).ToList();
        }

        public bool DeleteInstrument(Instrument instrument)
        {
            _dbContext.Instruments.Remove(instrument);
            return (_dbContext.SaveChanges() > 0);
        }

        // Counts the user's observations that directly reference this instrument.
        public int GetNumObservationsForInstrument(int instrumentId, int userId)
        {
            return _dbContext.Observations.Count(o => o.InstrumentId == instrumentId && o.UserId == userId);
        }

        // Counts the user's observation sessions that directly reference this instrument.
        public int GetNumObsSessionsForInstrument(int instrumentId, int userId)
        {
            return _dbContext.ObsSessions.Count(s => s.InstrumentId == instrumentId && s.UserId == userId);
        }

        // Builds per-instrument observation counts for the user's Instruments list.
        public IReadOnlyDictionary<int, int> GetObservationReferenceCounts(int userId)
        {
            return _dbContext.Observations
                .Where(o => o.UserId == userId && o.InstrumentId.HasValue)
                .GroupBy(o => o.InstrumentId.Value)
                .ToDictionary(g => g.Key, g => g.Count());
        }

        // Builds per-instrument observation-session counts for the user's Instruments list.
        public IReadOnlyDictionary<int, int> GetObsSessionReferenceCounts(int userId)
        {
            return _dbContext.ObsSessions
                .Where(s => s.UserId == userId && s.InstrumentId.HasValue)
                .GroupBy(s => s.InstrumentId.Value)
                .ToDictionary(g => g.Key, g => g.Count());
        }

        public bool AnyObservationReferences(int instrumentId)
        {
            return _dbContext.Observations.Any(o => o.InstrumentId == instrumentId);
        }

        public bool AnyObservationReferences(int instrumentId, int userId)
        {
            return _dbContext.Observations.Any(o => o.InstrumentId == instrumentId && o.UserId == userId);
        }

        public bool AnyObsSessionReferences(int instrumentId)
        {
            return _dbContext.ObsSessions.Any(s => s.InstrumentId == instrumentId);
        }

        public bool AnyObsSessionReferences(int instrumentId, int userId)
        {
            return _dbContext.ObsSessions.Any(s => s.InstrumentId == instrumentId && s.UserId == userId);
        }

        public bool SaveChanges()
        {
            return (_dbContext.SaveChanges() > 0);
        }
    }
}
