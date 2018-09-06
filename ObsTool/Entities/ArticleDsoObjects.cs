using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ObsTool.Entities
{
    public class ArticleDsoObjects
    {
        public Article Article { get; set; }
        public int ArticleId { get; set; }

        public Dso Dso { get; set; }
        public int DsoId { get; set; }
    }
}
