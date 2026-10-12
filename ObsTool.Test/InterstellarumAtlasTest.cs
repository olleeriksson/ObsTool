using System;
using System.Linq;
using NUnit.Framework;
using ObsTool.Services;

namespace TestProject
{
    public class InterstellarumAtlasTest
    {
        // Test the supplied geometry at every center, both poles, RA wrap, overlap, and distant sky.
        [Test]
        public void Contains_HandlesCentersPolesWrapAndOverlap()
        {
            Assert.That(InterstellarumAtlas.Charts.Count, Is.EqualTo(114));
            foreach (var chart in InterstellarumAtlas.Charts)
            {
                Assert.That(InterstellarumAtlas.Contains(chart, chart.Ra, chart.Dec), Is.True, $"Chart {chart.Number}");
                Assert.That(InterstellarumAtlas.Contains(chart, chart.Ra + 180, -chart.Dec), Is.False);
            }
            var north = InterstellarumAtlas.Charts.Single(c => c.Number == 1);
            var south = InterstellarumAtlas.Charts.Single(c => c.Number == 114);
            foreach (var ra in new[] { 0, 90, 180, 270 })
            {
                Assert.That(InterstellarumAtlas.Contains(north, ra, 90), Is.True);
                Assert.That(InterstellarumAtlas.Contains(south, ra, -90), Is.True);
            }
            Assert.That(InterstellarumAtlas.Charts.Where(c => InterstellarumAtlas.Contains(c, 210, 0)).Select(c => c.Number), Does.Contain(56).And.Contain(57));
            var wrap = InterstellarumAtlas.Charts.Single(c => c.Number == 107);
            Assert.That(InterstellarumAtlas.Contains(wrap, -1, -60), Is.EqualTo(InterstellarumAtlas.Contains(wrap, 359, -60)));
        }

        // Invalid catalog coordinates must not silently place an object at the origin.
        [TestCase(null, "+00 00", false)]
        [TestCase("bad", "+00 00", false)]
        [TestCase("13 60", "+00 00", false)]
        [TestCase("13 00", "-91 00", false)]
        [TestCase("13:00:00", "-00 30", true)]
        public void TryPosition_ValidatesSexagesimalCoordinates(string ra, string dec, bool valid)
        {
            Assert.That(InterstellarumAtlas.TryPosition(ra, dec, out _, out var latitude), Is.EqualTo(valid));
            if (valid) { Assert.That(latitude, Is.EqualTo(-0.5)); }
        }
    }
}
