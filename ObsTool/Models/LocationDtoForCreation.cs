using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ObsTool.Models
{
    public class LocationDtoForCreation
    {
        public string Name { get; set; }
        public string Longitude { get; set; }
        public string Latitude { get; set; }
        public string GoogleMapsAddress { get; set; }
    }
}
