using NUnit.Framework;
using ObsTool.Services;

namespace TestProject
{
    [TestFixture]
    public class HerschelSummaryExtractorTest
    {
        [Test]
        public void ExtractWilliamHerschelBlock_ReturnsHeadingAndTextUntilNextBlankLine()
        {
            string descrLong = "Earlier section\r\nText\r\n\r\nWilliam Herschel discovered this object.\r\nIt was faint and large.\r\n\r\nDreyer later wrote more.";

            string summary = HerschelSummaryExtractor.ExtractWilliamHerschelBlock(descrLong);

            Assert.That(summary, Is.EqualTo("William Herschel discovered this object.\r\nIt was faint and large."));
        }

        [Test]
        public void ExtractWilliamHerschelBlock_ReturnsNullWhenBlockIsMissing()
        {
            string summary = HerschelSummaryExtractor.ExtractWilliamHerschelBlock("Dreyer described this object.");

            Assert.That(summary, Is.Null);
        }
    }
}
