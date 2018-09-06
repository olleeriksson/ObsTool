using ObsTool.Models;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Threading.Tasks;

namespace ObsTool.Entities
{
    [Table("SacDeepSkyObjects")]
    public class Dso
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(50)]
        public string Catalog { get; set; }

        [MaxLength(50)]
        [Column("Catalog_number")]
        public string CatalogNumber { get; set; }

        [Required]
        [MaxLength(50)]
        public string Name { get; set; }

        [MaxLength(50)]
        [Column("Other_names")]
        public string OtherNames { get; set; }

        [MaxLength(200)]
        [Column("Common_name")]
        public string CommonName { get; set; }

        [MaxLength(500)]
        [Column("All_common_names")]
        public string AllCommonNames { get; set; }

        [Required]
        [MaxLength(50)]
        public string Type { get; set; }

        [Required]
        [MaxLength(50)]
        public string Con { get; set; }

        [Required]
        [MaxLength(50)]
        public string RA { get; set; }

        [Required]
        [MaxLength(50)]
        public string DEC { get; set; }

        [Required]
        [MaxLength(50)]
        public string Mag { get; set; }

        [Required]
        [MaxLength(50)]
        public string SB { get; set; }

        [Required]
        public int U2K { get; set; }

        [Required]
        public int TI { get; set; }

        [MaxLength(50)]
        [Column("Size_max")]
        public string SizeMax { get; set; }

        [MaxLength(50)]
        [Column("Size_min")]
        public string SizeMin { get; set; }

        [MaxLength(50)]
        public string PA { get; set; }

        [MaxLength(50)]
        public string Class { get; set; }

        [MaxLength(50)]
        public string NSTS { get; set; }

        [MaxLength(50)]
        public string BRSTR{ get; set; }

        [MaxLength(50)]
        public string BCHM { get; set; }

        [MaxLength(100)]
        [Column("Dreyer_desc")]
        public string DreyerDesc { get; set; }

        [MaxLength(100)]
        public string Notes { get; set; }

        public ICollection<ArticleDsoObjects> ReferringArticles { get; set; }

        public override string ToString()
        {
            return $"DSO[id: {Id}, name: {Name} ({OtherNames}), type: {Type} ]";
        }
    }
}
