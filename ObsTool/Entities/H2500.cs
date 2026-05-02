using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ObsTool.Entities
{
    [Table("H2500")]
    public class H2500
    {
        [Key]
        public int HerschelId { get; set; }

        [MaxLength(50)]
        public string HerschelNo { get; set; }

        [Required]
        [MaxLength(50)]
        public string Cat { get; set; }

        [Required]
        public int CatNo { get; set; }

        [MaxLength(50)]
        public string NameCompr { get; set; }

        [MaxLength(50)]
        public string Name { get; set; }

        public int? Status { get; set; }

        public int? Status2 { get; set; }

        public bool H400 { get; set; }

        [MaxLength(50)]
        public string Type { get; set; }

        [MaxLength(50)]
        public string Const { get; set; }

        [MaxLength(100)]
        public string Constellation { get; set; }

        public bool H2500ExclMissing { get; set; }

        public bool H2500Unseen { get; set; }

        public bool H2500Unmarked { get; set; }

        public bool H400ExclMissing { get; set; }

        public bool H400Unseen { get; set; }

        public string DescrLong { get; set; }

        public string DreyerTranslated { get; set; }

        public int? SacDeepSkyObjectsId { get; set; }

        [ForeignKey("SacDeepSkyObjectsId")]
        public Dso Dso { get; set; }
    }
}
