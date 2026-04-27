using System.ComponentModel.DataAnnotations;

namespace ObsTool.Entities
{
    public class Instrument
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(50)]
        public string Key { get; set; }

        [Required]
        [MaxLength(200)]
        public string Name { get; set; }

        public int DiameterMm { get; set; }

        [MaxLength(250)]
        public string FocalLengthMm { get; set; }
    }
}
