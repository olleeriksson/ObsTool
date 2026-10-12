using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace ObsTool.Services
{
    // Approximate photo-calibrated atlas footprints; each spread is the union of its physical leaves.
    public static class InterstellarumAtlas
    {
        public sealed record Chart(int Number, double Ra, double Dec, double[][][] Pages);
        public static IReadOnlyList<Chart> Charts { get; } = LoadCharts();

        // Load the single shared dataset once, independently of deployment working directory.
        private static IReadOnlyList<Chart> LoadCharts()
        {
            using var stream = typeof(InterstellarumAtlas).Assembly.GetManifestResourceStream("ObsTool.Interstellarum.json");
            using var document = JsonDocument.Parse(stream);
            return document.RootElement.GetProperty("charts").EnumerateArray().Select(chart => new Chart(
                chart.GetProperty("chart").GetInt32(),
                (chart.GetProperty("projection_center_ra_hours").ValueKind == JsonValueKind.Null ? 0 : chart.GetProperty("projection_center_ra_hours").GetDouble() * 15),
                chart.GetProperty("projection_center_dec_deg").GetDouble(),
                chart.GetProperty("pages").EnumerateArray().Select(page =>
                    page.GetProperty("projection_plane_corners_degree_equivalent").EnumerateArray()
                        .Select(point => point.EnumerateArray().Select(value => value.GetDouble()).ToArray()).ToArray()).ToArray()
            )).ToArray();
        }

        // Parse catalog sexagesimal coordinates, rejecting missing or out-of-range positions.
        public static bool TryPosition(string ra, string dec, out double longitude, out double latitude)
        {
            longitude = latitude = 0;
            if (!TryCoordinate(ra, out var hours) || !TryCoordinate(dec, out latitude)
                || hours < 0 || hours > 24 || Math.Abs(latitude) > 90) { return false; }
            longitude = hours * 15;
            return true;
        }

        // Accept the catalog's spaces/colon separators without inventing positions for malformed data.
        private static bool TryCoordinate(string text, out double value)
        {
            value = 0;
            if (string.IsNullOrWhiteSpace(text)) { return false; }
            var parts = Regex.Split(text.Trim(), @"[\s:]+");
            if (parts.Length > 3) { return false; }
            var numbers = new double[parts.Length];
            for (var i = 0; i < parts.Length; i++)
            {
                if (!double.TryParse(parts[i], NumberStyles.Float, CultureInfo.InvariantCulture, out numbers[i])
                    || !double.IsFinite(numbers[i]) || (i > 0 && (numbers[i] < 0 || numbers[i] >= 60))) { return false; }
            }
            var sign = text.TrimStart().StartsWith("-", StringComparison.Ordinal) ? -1 : 1;
            value = sign * (Math.Abs(numbers[0]) + (parts.Length > 1 ? numbers[1] / 60 : 0)
                + (parts.Length > 2 ? numbers[2] / 3600 : 0));
            return true;
        }

        // Stereographic lookup avoids RA wrapping and includes a point once even in the binding overlap.
        public static bool Contains(Chart chart, double ra, double dec)
        {
            if (!double.IsFinite(ra) || !double.IsFinite(dec) || Math.Abs(dec) > 90) { return false; }
            const double radians = Math.PI / 180;
            var delta = (ra - chart.Ra) * radians;
            var latitude = dec * radians;
            var center = chart.Dec * radians;
            var denominator = 1 + Math.Sin(center) * Math.Sin(latitude)
                + Math.Cos(center) * Math.Cos(latitude) * Math.Cos(delta);
            if (denominator < 1e-12) { return false; }
            var x = -2 * Math.Cos(latitude) * Math.Sin(delta) / denominator / radians;
            var y = 2 * (Math.Cos(center) * Math.Sin(latitude)
                - Math.Sin(center) * Math.Cos(latitude) * Math.Cos(delta)) / denominator / radians;
            return chart.Pages.Any(page => InsideConvexPage(page, x, y));
        }

        // The calibrated leaves are convex quadrilaterals; accept their edges within rounding tolerance.
        private static bool InsideConvexPage(double[][] corners, double x, double y)
        {
            var positive = false;
            var negative = false;
            for (var i = 0; i < corners.Length; i++)
            {
                var a = corners[i];
                var b = corners[(i + 1) % corners.Length];
                var cross = (b[0] - a[0]) * (y - a[1]) - (b[1] - a[1]) * (x - a[0]);
                positive |= cross > 1e-5;
                negative |= cross < -1e-5;
                if (positive && negative) { return false; }
            }
            return true;
        }
    }
}
