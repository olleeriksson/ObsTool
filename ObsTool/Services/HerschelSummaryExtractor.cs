using System;
using System.Collections.Generic;
using System.Linq;

namespace ObsTool.Services
{
    public static class HerschelSummaryExtractor
    {
        /// <summary>
        /// Extracts the temporary v1 William Herschel paragraph from a long H2500 description.
        /// </summary>
        public static string ExtractWilliamHerschelBlock(string descrLong)
        {
            if (string.IsNullOrWhiteSpace(descrLong))
            {
                return null;
            }

            string normalizedText = descrLong.Replace("\r\n", "\n").Replace("\r", "\n");
            string[] lines = normalizedText.Split('\n');

            int startIndex = Array.FindIndex(lines, line => line.TrimStart().StartsWith("William Herschel"));
            if (startIndex < 0)
            {
                return null;
            }

            var blockLines = new List<string>();
            for (int i = startIndex; i < lines.Length; i++)
            {
                if (i > startIndex && string.IsNullOrWhiteSpace(lines[i]))
                {
                    break;
                }

                blockLines.Add(lines[i].TrimEnd());
            }

            return string.Join(Environment.NewLine, blockLines).Trim();
        }
    }
}
