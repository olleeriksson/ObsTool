using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace ObsTool.Services
{
    internal static class DsoDesignationNormalizer
    {
        private static readonly HashSet<string> LetterDigitCatalogPrefixes = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "M",
            "He",
            "K",
            "Sh",
            "H",
            "Vd"
        };

        /// <summary>
        /// Builds keys used for broad search, including normal text, compact text, and catalog-specific canonical forms.
        /// </summary>
        public static IReadOnlyCollection<string> BuildSearchKeys(string value)
        {
            var keys = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            AddValueKeys(value, keys, includeFreeText: true);
            return keys;
        }

        /// <summary>
        /// Builds keys used when the caller needs an exact object-name or alias match.
        /// </summary>
        public static IReadOnlyCollection<string> BuildExactKeys(string value)
        {
            var keys = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            AddValueKeys(value, keys, includeFreeText: true);
            return keys;
        }

        /// <summary>
        /// Collapses case and whitespace for readable text comparisons.
        /// </summary>
        public static string NormalizeFreeText(string value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return string.Empty;
            }

            var builder = new StringBuilder();
            bool previousWasSpace = false;
            foreach (char character in value.Trim())
            {
                if (char.IsWhiteSpace(character))
                {
                    if (!previousWasSpace && builder.Length > 0)
                    {
                        builder.Append(' ');
                    }

                    previousWasSpace = true;
                    continue;
                }

                builder.Append(char.ToLowerInvariant(character));
                previousWasSpace = false;
            }

            return builder.ToString();
        }

        /// <summary>
        /// Removes whitespace while preserving punctuation so M3-4 and M34 remain different keys.
        /// </summary>
        public static string NormalizeCompactText(string value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return string.Empty;
            }

            var builder = new StringBuilder();
            foreach (char character in value)
            {
                if (!char.IsWhiteSpace(character))
                {
                    builder.Append(char.ToLowerInvariant(character));
                }
            }

            return builder.ToString();
        }

        /// <summary>
        /// Adds keys for the full field and each visible alias inside comma/semicolon-separated fields.
        /// </summary>
        private static void AddValueKeys(string value, ISet<string> keys, bool includeFreeText)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return;
            }

            AddSingleDesignationKeys(value, keys, includeFreeText);
            foreach (string alias in SplitAliases(value))
            {
                AddSingleDesignationKeys(alias, keys, includeFreeText);
            }
        }

        /// <summary>
        /// Adds normalized keys for one object name or alias.
        /// </summary>
        private static void AddSingleDesignationKeys(string value, ISet<string> keys, bool includeFreeText)
        {
            string freeText = NormalizeFreeText(value);
            if (includeFreeText)
            {
                AddKey(keys, freeText);
            }

            string compactText = NormalizeCompactText(value);
            AddKey(keys, compactText);

            TryAddMcgKey(compactText, keys);
            TryAddEsoKey(compactText, keys);
            TryAddLetterDigitHyphenKey(compactText, keys);
            TryAddLetterDigitSpaceKey(freeText, keys);
        }

        /// <summary>
        /// Adds a normalized MCG key from compact aliases such as mcg5-1-66 or mcg+05-01-066.
        /// </summary>
        private static void TryAddMcgKey(string compactText, ISet<string> keys)
        {
            if (!compactText.StartsWith("mcg", StringComparison.OrdinalIgnoreCase))
            {
                return;
            }

            string rest = compactText.Substring(3);
            string sign = "+";
            if (rest.StartsWith("+", StringComparison.Ordinal) || rest.StartsWith("-", StringComparison.Ordinal))
            {
                sign = rest.Substring(0, 1);
                rest = rest.Substring(1);
            }

            string[] parts = rest.Split('-');
            if (parts.Length != 3
                || !int.TryParse(parts[0], out int zone)
                || !int.TryParse(parts[1], out int field)
                || !TryParseNumberSuffix(parts[2], out int number, out string suffix))
            {
                return;
            }

            AddKey(keys, $"mcg{sign}{zone:00}-{field:00}-{number:000}{suffix}");
        }

        /// <summary>
        /// Adds a normalized ESO key from compact aliases such as eso434-6, eso434-006, or eso373-g8.
        /// </summary>
        private static void TryAddEsoKey(string compactText, ISet<string> keys)
        {
            if (!compactText.StartsWith("eso", StringComparison.OrdinalIgnoreCase))
            {
                return;
            }

            string rest = compactText.Substring(3);
            string[] parts = rest.Split('-');
            if (parts.Length != 2
                || !int.TryParse(parts[0], out int field)
                || !TryParseEsoNumberPart(parts[1], out string subtype, out int number, out string suffix))
            {
                return;
            }

            if (string.IsNullOrEmpty(subtype))
            {
                AddKey(keys, $"eso{field:000}-{number:000}{suffix}");
            }
            else if (string.Equals(subtype, "g", StringComparison.OrdinalIgnoreCase))
            {
                AddKey(keys, $"eso{field:000}-g{number:000}{suffix}");
            }
            else
            {
                AddKey(keys, $"eso{field:000}-{subtype.ToLowerInvariant()}{number}{suffix}");
            }
        }

        /// <summary>
        /// Adds a stable key for letter-number catalogs such as M3-4, He2-10, and Sh2-276.
        /// </summary>
        private static void TryAddLetterDigitHyphenKey(string compactText, ISet<string> keys)
        {
            string[] parts = compactText.Split('-');
            if (parts.Length != 2
                || !TrySplitLettersDigits(parts[0], out string letters, out string prefixNumber)
                || !LetterDigitCatalogPrefixes.Contains(letters)
                || string.IsNullOrWhiteSpace(parts[1]))
            {
                return;
            }

            AddKey(keys, $"{letters.ToLowerInvariant()}{prefixNumber}-{parts[1].ToLowerInvariant()}");
        }

        /// <summary>
        /// Adds a Sh2-style key when a user types the hyphen as a space, for example Sh2 276.
        /// </summary>
        private static void TryAddLetterDigitSpaceKey(string freeText, ISet<string> keys)
        {
            string[] parts = freeText.Split(' ', StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length != 2
                || !TrySplitLettersDigits(parts[0], out string letters, out string prefixNumber)
                || !LetterDigitCatalogPrefixes.Contains(letters)
                || !StartsWithDigit(parts[1]))
            {
                return;
            }

            AddKey(keys, $"{letters.ToLowerInvariant()}{prefixNumber}-{parts[1].ToLowerInvariant()}");
        }

        /// <summary>
        /// Splits an ESO number token into optional subtype, number, and suffix parts.
        /// </summary>
        private static bool TryParseEsoNumberPart(string value, out string subtype, out int number, out string suffix)
        {
            subtype = string.Empty;
            number = 0;
            suffix = string.Empty;

            int index = 0;
            while (index < value.Length && char.IsLetter(value[index]))
            {
                index++;
            }

            subtype = value.Substring(0, index);
            return TryParseNumberSuffix(value.Substring(index), out number, out suffix);
        }

        /// <summary>
        /// Splits values like 008A into number 8 plus suffix a.
        /// </summary>
        private static bool TryParseNumberSuffix(string value, out int number, out string suffix)
        {
            number = 0;
            suffix = string.Empty;

            int index = 0;
            while (index < value.Length && char.IsDigit(value[index]))
            {
                index++;
            }

            if (index == 0 || !int.TryParse(value.Substring(0, index), out number))
            {
                return false;
            }

            suffix = value.Substring(index).ToLowerInvariant();
            return suffix.All(char.IsLetter);
        }

        /// <summary>
        /// Splits a compact prefix such as Sh2 into letters Sh and number 2.
        /// </summary>
        private static bool TrySplitLettersDigits(string value, out string letters, out string digits)
        {
            letters = string.Empty;
            digits = string.Empty;

            int index = 0;
            while (index < value.Length && char.IsLetter(value[index]))
            {
                index++;
            }

            if (index == 0 || index == value.Length)
            {
                return false;
            }

            letters = value.Substring(0, index);
            digits = value.Substring(index);
            return digits.All(char.IsDigit);
        }

        /// <summary>
        /// Splits semicolon/comma-separated alias fields while keeping the full field as a separate key elsewhere.
        /// </summary>
        private static IEnumerable<string> SplitAliases(string value)
        {
            return value.Split(new[] { ';', ',' }, StringSplitOptions.RemoveEmptyEntries)
                .Select(alias => alias.Trim())
                .Where(alias => alias.Length > 0);
        }

        /// <summary>
        /// Adds a non-empty key to the target set.
        /// </summary>
        private static void AddKey(ISet<string> keys, string key)
        {
            if (!string.IsNullOrWhiteSpace(key))
            {
                keys.Add(key);
            }
        }

        /// <summary>
        /// Checks whether the value starts with a digit without allocating a numeric parse.
        /// </summary>
        private static bool StartsWithDigit(string value)
        {
            return value.Length > 0 && char.IsDigit(value[0]);
        }
    }
}
