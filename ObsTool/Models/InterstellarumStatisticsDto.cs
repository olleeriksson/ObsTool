namespace ObsTool.Models
{
    // Counts use Herschel row identity for checklist progress and distinct DSO identity for all detections.
    public class InterstellarumStatisticsDto
    {
        public int Chart { get; set; }
        public int Observed { get; set; }
        public ObsGroupStatisticsDto H2500 { get; set; }
        public ObsGroupStatisticsDto H400 { get; set; }
    }
}
