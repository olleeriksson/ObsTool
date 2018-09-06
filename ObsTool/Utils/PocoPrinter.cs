using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Reflection;
using System.Text;


namespace ObsTool.Utils
{
    public class PocoPrinter
    {
        public static string ToString(object obj)
        {
            if (obj == null)
            {
                return "null";
            }

            var type = obj.GetType();
            var sb = new StringBuilder();
            sb.Append(Environment.NewLine);
            foreach (var property in type.GetProperties())
            {
                sb.Append(property.Name + ": ");
                Object value = property.GetValue(obj);
                sb.Append(value == null ? "null" : value.ToString());
                sb.Append(Environment.NewLine);
            }

            return sb.ToString();
        }
    }
}