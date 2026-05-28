using System.ComponentModel.DataAnnotations;

namespace ObsTool.Entities
{
    public class Instrument
    {
        [Key]
        public int Id { get; set; }

        public int UserId { get; set; }

        public AppUser User { get; set; }

        [Required]
        [MaxLength(50)]
        public string Key { get; set; }

        [Required]
        [MaxLength(200)]
        public string Name { get; set; }

        public int? DiameterMm { get; set; }

        public int? FocalLengthMm { get; set; }
    }
}
