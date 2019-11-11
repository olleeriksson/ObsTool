using ObsTool.Models;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Threading.Tasks;

namespace ObsTool.Entities
{
    public class DsoExtra
    {
        [Key]
        public int Id { get; set; }

        public int DsoId { get; set; }

        public Dso Dso { get; set; }

        public int? Rating { get; set; }

        public bool? FollowUp { get; set; } = false;

        public ObsSession ObsSession { get; set; }

        public int ObsSessionId { get; set; }
    }
}
