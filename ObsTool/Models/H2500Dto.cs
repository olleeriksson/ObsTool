namespace ObsTool.Models
{
    public class H2500Dto
    {
        public int HerschelId { get; set; }
        public string HerschelNo { get; set; }
        public string Cat { get; set; }
        public int CatNo { get; set; }
        public string Name { get; set; }
        public int? Status { get; set; }
        public bool H400 { get; set; }
        public string Const { get; set; }
        public string DescrLong { get; set; }
        public int? SacDeepSkyObjectsId { get; set; }
        public DsoDto Dso { get; set; }
    }
}
