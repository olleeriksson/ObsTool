using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ObsTool.Entities
{
    [Table("Events")]
    public class SystemEvent
    {
        [Key]
        public int Id { get; set; }

        public int? UserId { get; set; }

        public AppUser User { get; set; }

        [MaxLength(200)]
        public string FullName { get; set; }

        [Required]
        [MaxLength(200)]
        public string EventKey { get; set; }

        [Required]
        [MaxLength(100)]
        public string EventName { get; set; }

        [MaxLength(1000)]
        public string Details { get; set; }

        public DateTime OccurredUtc { get; set; }

        public DateTime? AdminNotificationSentUtc { get; set; }

        public string AdminNotificationError { get; set; }
    }
}
