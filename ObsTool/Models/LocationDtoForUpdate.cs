using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ObsTool.Models
{
    public class LocationDtoForUpdate
    {
        public string Name { get; set; }
        public float? Longitude { get; set; } = null;
        public float? Latitude { get; set; } = null;
        public string GoogleMapsAddress { get; set; }
    }
}
