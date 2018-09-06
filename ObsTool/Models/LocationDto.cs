using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ObsTool.Models
{
    public class LocationDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public float? Longitude { get; set; } = null;
        public float? Latitude { get; set; } = null;
        public string GoogleMapsAddress { get; set; }
    }
}
