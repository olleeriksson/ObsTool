using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ObsTool
{
    public class ObsToolException : Exception
    {
        public int ErrorCode { get; set; }

        public ObsToolException(string message)
            : base(message)
        {
            ErrorCode = 400;
        }

        public ObsToolException(int errorCode, string message)
        : base(message)
        {
            ErrorCode = errorCode;
        }
    }
}
