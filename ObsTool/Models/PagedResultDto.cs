using ObsTool.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ObsTool.Models
{
    public class PagedResultDto<T>
    {
        public T[] Data { get; set; }
        public int Total { get; set; }
        public int Count { get; set; }
        public int More { get; set; }
    }
}
