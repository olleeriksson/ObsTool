using System;

namespace ObsTool.Models
{
    public class SystemEventDto
    {
        public int Id { get; set; }
        public int? UserId { get; set; }
        public string FullName { get; set; }
        public string EventKey { get; set; }
        public string EventName { get; set; }
        public string Details { get; set; }
        public DateTime OccurredUtc { get; set; }
        public DateTime? AdminNotificationSentUtc { get; set; }
        public string AdminNotificationError { get; set; }
    }
}
