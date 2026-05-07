namespace ObsTool.Models
{
    public class ConstellationStatisticsDto
    {
        public string Constellation { get; set; }
        public string ConstellationAbbrv { get; set; }
        public int Observed { get; set; }
        public ObsGroupStatisticsDto H2500 { get; set; }
        public ObsGroupStatisticsDto H400 { get; set; }
    }
}
