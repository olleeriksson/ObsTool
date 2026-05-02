namespace ObsTool.Models
{
    public class H2500Dto
    {
        public int HerschelId { get; set; }
        public string HerschelNo { get; set; }
        public string Cat { get; set; }
        public int CatNo { get; set; }
        public string NameCompr { get; set; }
        public string Name { get; set; }
        public int? Status { get; set; }
        public int? Status2 { get; set; }
        public bool H400 { get; set; }
        public string Type { get; set; }
        public string Const { get; set; }
        public string Constellation { get; set; }
        public bool H2500ExclMissing { get; set; }
        public bool H2500Unseen { get; set; }
        public bool H2500Unmarked { get; set; }
        public bool H400ExclMissing { get; set; }
        public bool H400Unseen { get; set; }
        public string DescrLong { get; set; }
        public string DreyerTranslated { get; set; }
        public int? SacDeepSkyObjectsId { get; set; }
        public DsoDto Dso { get; set; }
    }
}
