using ObsTool.Models;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace ObsTool.Entities
{
    public class Article
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(500)]
        public string Title { get; set; }

        [Required]
        public DsoType Type { get; set; }

        [Required]
        public string Description { get; set; }

        public ICollection<ArticleConstellations> ArticleConstellations { get; set; } = new List<ArticleConstellations>();

        [Required]
        public int InterestRating { get; set; }

        [Required]
        public int Priority { get; set; }

        public ICollection<ArticleDsoObjects> Objects { get; set; }

        [Required]
        public SearchField SearchField { get; set; }

        [Required]
        public Season Season { get; set; }

        [Required]
        public Difficulty Difficulty{ get; set; }

    }
}
