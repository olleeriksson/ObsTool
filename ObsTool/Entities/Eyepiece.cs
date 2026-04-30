using System.ComponentModel.DataAnnotations;

namespace ObsTool.Entities
{
    public class Eyepiece
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(50)]
        public string Key { get; set; }

        [Required]
        [MaxLength(150)]
        public string Name { get; set; }

        public int FocalLengthMm { get; set; }
    }
}
