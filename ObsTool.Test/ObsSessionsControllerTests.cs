using ObsTool.Controllers;
using NUnit.Framework;
using System;

namespace TestProject
{
    [TestFixture]
    public class ObsSessionsControllerTests
    {
        [Test]
        public void testDummyMethod()
        {
            string expected = "dummy";

            ObsSessionsController obsSessionsController = new ObsSessionsController(null, null, null, null, null, null, null, null);
            string result = obsSessionsController.dummyMethod();

            Assert.AreEqual(expected, result);
            Assert.That(result, Is.EqualTo(expected));

        }
    }
}
