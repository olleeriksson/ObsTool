using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ObsTool.Entities
{
    [Table("Users")]
    public class AppUser
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(320)]
        public string Email { get; set; }

        [Required]
        [MaxLength(320)]
        public string NormalizedEmail { get; set; }

        [MaxLength(100)]
        public string Username { get; set; }

        [MaxLength(100)]
        public string NormalizedUsername { get; set; }

        [Required]
        [MaxLength(200)]
        public string FullName { get; set; }

        [Required]
        public string PasswordHash { get; set; }

        public bool EmailConfirmed { get; set; }

        [MaxLength(128)]
        public string EmailConfirmationTokenHash { get; set; }

        public DateTime? EmailConfirmationTokenExpiresUtc { get; set; }

        [MaxLength(128)]
        public string PasswordResetTokenHash { get; set; }

        public DateTime? PasswordResetTokenExpiresUtc { get; set; }

        public DateTime CreatedUtc { get; set; }

        public DateTime? UpdatedUtc { get; set; }

        public DateTime? LastLoginUtc { get; set; }
    }
}
