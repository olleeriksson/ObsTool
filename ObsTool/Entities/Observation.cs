﻿using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Threading.Tasks;

namespace ObsTool.Entities
{
    public class Observation
    {
        [Key]
        public int Id { get; set; }

        // Can not have this here because it creates a self referencing loop between ObsSession and Observation
        //[Required]
        //public ObsSession ObsSession { get; set; }

        // We'll have to do with this one, so we can look up the ObsSession separately
        [ForeignKey("ObsSessionId")]
        public int ObsSessionId { get; set; }

        //[ForeignKey("DsoId")]
        //public Dso Dso { get; set; }

        //public int DsoId { get; set; }

        [MaxLength(200)]
        public string Identifier { get; set; }

        public List<DsoObservation> DsoObservations { get; set; } = new List<DsoObservation>();

        //public string CustomObjectName { get; set; }

        [MaxLength(4000)]
        public string Text { get; set; }

        public int? DisplayOrder { get; set; }

        public List<ObsResource> ObsResources { get; set; } = new List<ObsResource>();

        public bool NonDetection { get; set; } = false;
    }
}
