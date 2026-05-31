namespace ObsTool.Models
{
    public class InstrumentDto
    {
        public int Id { get; set; }
        public string Key { get; set; }
        public string Name { get; set; }
        public int? DiameterMm { get; set; }
        public int? FocalLengthMm { get; set; }
        public string IconReference { get; set; }
        public int NumObservationReferences { get; set; }
        public int NumObsSessionReferences { get; set; }
        public int NumReferences { get; set; }
    }
}
