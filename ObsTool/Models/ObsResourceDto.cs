using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Threading.Tasks;

namespace ObsTool.Models
{
    public class ObsResourceDto
    {
        public int Id { get; set; }

        public string Type { get; set; }

        public string Name { get; set; }

        public string Url { get; set; }

        public int Rotation { get; set; } = 0;

        public int ZoomLevel { get; set; } = 100;

        public bool Inverted { get; set; } = false;

        public int BackgroundColor { get; set; } = 0;
    }
}
