namespace ObsTool.Models
{
    public class ConstellationMapObjectDto
    {
        public int HerschelId { get; set; }
        public string HerschelNo { get; set; }
        public bool H400 { get; set; }
        public int DsoId { get; set; }
        public string Name { get; set; }
        public string Catalog { get; set; }
        public string CatalogNumber { get; set; }
        public string Constellation { get; set; }
        public string RA { get; set; }
        public string DEC { get; set; }
        public bool IsObserved { get; set; }
    }
}
