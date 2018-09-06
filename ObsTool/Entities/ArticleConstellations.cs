using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ObsTool.Entities
{
    public class ArticleConstellations
    {
        public Article Article { get; set; }
        public int ArticleId { get; set; }

        public Constellation Constellation { get; set; }
        public int ConstellationId { get; set; }
    }
}
