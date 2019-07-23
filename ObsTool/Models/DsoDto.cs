using ObsTool.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ObsTool.Models
{
    public class DsoDto
    {
        private string _otherCommonNames;

        public int Id { get; set; }
        public string Catalog { get; set; }
        public string CatalogNumber { get; set; }
        public string Name { get; set; }
        public string OtherNames { get; set; }
        public string CommonName { get; set; }
        public string AllCommonNames { get; set; }
        public string OtherCommonNames {
            get
            {
                if (AllCommonNames != null && AllCommonNames.Contains(CommonName))
                {
                    this._otherCommonNames = AllCommonNames
                        .Replace(", " + CommonName, "")
                        .Replace(CommonName + ", ", "")
                        .Replace(CommonName, "");
                }
                return this._otherCommonNames;
            }
            set
            {
                _otherCommonNames = value;
            }
        }
        public string Type { get; set; }
        public string Con { get; set; }
        public string RA { get; set; }
        public string DEC { get; set; }
        public string Mag { get; set; }
        public string SB { get; set; }
        public int U2K { get; set; }
        public int TI { get; set; }
        public string SizeMax { get; set; }
        public string SizeMin { get; set; }
        public string PA { get; set; }
        public string Class { get; set; }
        public string NSTS { get; set; }
        public string BRSTR { get; set; }
        public string BCHM { get; set; }
        public string DreyerDesc { get; set; }
        public string Notes { get; set; }
        public DsoExtraDto DsoExtra { get; set; }
        public int NumObservations { get; set; }
        public ObservationDto[] Observations { get; set; }
    }
}
