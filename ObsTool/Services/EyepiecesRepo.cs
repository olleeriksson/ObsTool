using System.Collections.Generic;
using System.Linq;
using ObsTool.Database;
using ObsTool.Entities;

namespace ObsTool.Services
{
    public class EyepiecesRepo
    {
        private MainDbContext _dbContext;

        public EyepiecesRepo(MainDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public Eyepiece AddEyepiece(Eyepiece eyepiece, int userId)
        {
            eyepiece.UserId = userId;
            var added = _dbContext.Eyepieces.Add(eyepiece);
            _dbContext.SaveChanges();
            return added.Entity;
        }

        public Eyepiece GetEyepiece(int id)
        {
            return _dbContext.Eyepieces.FirstOrDefault(e => e.Id == id);
        }

        public Eyepiece GetEyepiece(int id, int userId)
        {
            return _dbContext.Eyepieces.FirstOrDefault(e => e.Id == id && e.UserId == userId);
        }

        public IEnumerable<Eyepiece> GetEyepieces()
        {
            return _dbContext.Eyepieces.ToList();
        }

        public IEnumerable<Eyepiece> GetEyepieces(int userId)
        {
            return _dbContext.Eyepieces.Where(e => e.UserId == userId).ToList();
        }

        public bool DeleteEyepiece(Eyepiece eyepiece)
        {
            _dbContext.Eyepieces.Remove(eyepiece);
            return (_dbContext.SaveChanges() > 0);
        }

        public bool SaveChanges()
        {
            return (_dbContext.SaveChanges() > 0);
        }
    }
}
