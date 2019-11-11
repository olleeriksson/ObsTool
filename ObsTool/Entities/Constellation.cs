using ObsTool.Models;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace ObsTool.Entities
{
    public class Constellation
    {
        public Constellation(string name, string abbreviation)
        {
            Name = name;
            Abbreviation = abbreviation;
        }

        [Key]
        public int Id { get; set; }

        public string Abbreviation { get; set; }

        public string Name { get; set; }

        public Season Season { get; set; }

        public ICollection<ArticleConstellations> ReferringArticles { get; set; }
    }
}
