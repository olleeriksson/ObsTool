using ObsTool.Controllers;
using NUnit.Framework;
using System;
using ObsTool.Entities;
using ObsTool.Utils;

namespace TestProject
{
    [TestFixture]
    public class ObsSessionsControllerTests
    {
        //[Test]
        //public void testDummyMethod()
        //{
            //ObsSessionsController obsSessionsController = new ObsSessionsController(null, null, null, null, null, null, null, null);
            //string result = obsSessionsController.dummyMethod();

            //Assert.AreEqual(expected, result);
            //Assert.That(result, Is.EqualTo(expected));
        //}

        [Test]
        public void testPrintPoco()
        {
            ObsSession obsSession = new ObsSession
            {
                Id = 5,
                Date = DateTime.Now,
                Location = new Location
                {
                    Id = 6,
                    Name = "Some location",
                    GoogleMapsAddress = "Some address"
                },
                LocationId = 10,
                Title = "A great title",
                Summary = "Summary Summary Summary Summary Summary Summary Summary Summary Summary Summary "
                    + "Summary Summary Summary Summary Summary Summary Summary Summary Summary Summary "
                    + "Summary Summary Summary Summary Summary Summary Summary Summary Summary Summary "
                    + "Summary Summary Summary Summary Summary Summary Summary Summary Summary Summary "
                    + "Summary Summary Summary Summary Summary Summary Summary Summary Summary Summary "
                    + "Summary Summary Summary Summary Summary Summary Summary Summary Summary Summary ",
                ReportText = "Report text Report text Report text Report text Report text Report text Report text "
                    + "Report text Report text Report text Report text Report text Report text Report text "
                    + "Report text Report text Report text Report text Report text Report text Report text "
                    + "Report text Report text Report text Report text Report text Report text Report text "
                    + "Report text Report text Report text Report text Report text Report text Report text "
                    + "Report text Report text Report text Report text Report text Report text Report text "
                    + "Report text Report text Report text Report text Report text Report text Report text "
                    + "Report text Report text Report text Report text Report text Report text Report text "
                    + "Report text Report text Report text Report text Report text Report text Report text "
                    + "Report text Report text Report text Report text Report text Report text Report text "
                    + "Report text Report text Report text Report text Report text Report text Report text "
                    + "Report text Report text Report text Report text Report text Report text Report text "
                    + "Report text Report text Report text Report text Report text Report text Report text "
                    + "Report text Report text Report text Report text Report text Report text Report text "
                    + "Report text Report text Report text Report text Report text Report text Report text "
                    + "Report text Report text Report text Report text Report text Report text Report text "
                    + "Report text Report text Report text Report text Report text Report text Report text "
                    + "Report text Report text Report text Report text Report text Report text Report text "
                    + "Report text Report text Report text Report text Report text Report text Report text "
                    + "Report text Report text Report text Report text Report text Report text Report text "
                    + "Report text Report text Report text Report text Report text Report text Report text "
                    + "Report text Report text Report text Report text Report text Report text Report text ",
            };

            string text = PocoPrinter.ToString(obsSession);
            Console.WriteLine(text);
        }
    }
}
