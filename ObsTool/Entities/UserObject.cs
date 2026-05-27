using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace ObsTool.Entities
{
    public class UserObject
    {
        [Key]
        public int Id { get; set; }

        public int UserId { get; set; }

        public AppUser User { get; set; }

        [Required]
        [MaxLength(200)]
        public string Name { get; set; }

        [MaxLength(500)]
        public string OtherNames { get; set; }

        [MaxLength(200)]
        public string CommonName { get; set; }

        [MaxLength(500)]
        public string AllCommonNames { get; set; }

        [MaxLength(1000)]
        public string Notes { get; set; }

        [MaxLength(50)]
        public string Type { get; set; }

        [MaxLength(50)]
        public string Const { get; set; }

        [MaxLength(50)]
        public string RA { get; set; }

        [MaxLength(50)]
        public string DEC { get; set; }

        [MaxLength(50)]
        public string Mag { get; set; }

        public ICollection<DsoObservation> DsoObservations { get; set; }
    }
}
