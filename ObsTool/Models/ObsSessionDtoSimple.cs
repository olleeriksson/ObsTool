using ObsTool.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ObsTool.Models
{
    public class ObsSessionDtoSimple
    {
        public int Id { get; set; }
        private DateTime? _date;
        public String Date
        {
            get
            {
                return _date?.ToString("yyyy-MM-dd");
            }
            set
            {
                _date = DateTime.Parse(value);
            }
        }
        public LocationDto Location { get; set; }
        public string Title { get; set; }
        public string Summary { get; set; }
        public string Conditions { get; set; }
        public int? Seeing { get; set; }
        public int? Transparency { get; set; }
        public decimal? LimitingMagnitude { get; set; }
    }
}
