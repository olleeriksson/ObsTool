using ObsTool.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ObsTool.Models
{
    public class DsoExtraDto
    {
        public int Id { get; set; }
        public int? Rating { get; set; }
        public bool? FollowUp { get; set; }
    }
}
