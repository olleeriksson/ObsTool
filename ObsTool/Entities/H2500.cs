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
        public string Name { get; set; }

        public int? Status { get; set; }

        public bool H400 { get; set; }

        [MaxLength(50)]
        public string Const { get; set; }

        public string DescrLong { get; set; }

        public int? SacDeepSkyObjectsId { get; set; }

        [ForeignKey("SacDeepSkyObjectsId")]
        public Dso Dso { get; set; }
    }
}
