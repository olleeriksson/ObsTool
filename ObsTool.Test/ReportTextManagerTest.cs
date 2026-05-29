using ObsTool.Controllers;
using NUnit.Framework;
using System;
using ObsTool.Entities;
using ObsTool.Utils;
using ObsTool.Services;
using System.Collections.Generic;
using System.Linq;
using Moq;
using ObsTool;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using ObsTool.Database;

namespace TestProject
{
    [TestFixture]
    public class ReportTextManagerTest
    {
        Mock<IDsoRepo> obsRepoMock;
        int generatedDsoId = 0;

        [SetUp]
        public void Setup()
        {
            generatedDsoId = 0;
            var configMock = new Mock<IConfiguration>();
            configMock.Setup(c => c["Db:Migrate"]).Returns("false");
            Startup.Configuration = configMock.Object;
            obsRepoMock = new Mock<IDsoRepo>();
            obsRepoMock.CallBase = true;
            obsRepoMock.Setup(x => x.GetAllCatalogs())
                .Returns(new List<string> { "M", "Tr", "LND", "NGC", "IC", "Sh", "UGC", "PGC", "Cr", "B", "Pal" });
            obsRepoMock.Setup(x => x.GetDsoByName(It.IsAny<string>(), false))
                .Returns((string name, bool normalize) => new Dso
                {
                    Id = generatedDsoId++,
                    Name = name
                }); ;
            obsRepoMock.Setup(x => x.GetDsoByName(It.IsAny<string>(), false, It.IsAny<int>()))
                .Returns((string name, bool normalize, int userId) => new Dso
                {
                    Id = generatedDsoId++,
                    Name = name
                }); ;
        }

        [Test]
        public void testParsing1()
        {
            ReportTextManager reportTextManager = new ReportTextManager(null, null, obsRepoMock.Object, null, null);
            ObsSession obsSession = new ObsSession
            {
                Id = 5,
                Date = DateTime.Now,
                ReportText = "Bla bla bla M11 asdasdd\n" +
                "\n" +
                "dsflksd j M12 dsfklfsdfs",
            };
            IDictionary<string, Observation> observationsMap = reportTextManager.Parse(obsSession);
            Assert.That(observationsMap.Count, Is.EqualTo(2));
        }

        [Test]
        public void testParsing2()
        {
            ReportTextManager reportTextManager = new ReportTextManager(null, null, obsRepoMock.Object, null, null);
            ObsSession obsSession = new ObsSession
            {
                Id = 5,
                Date = DateTime.Now,
                ReportText = 
                    @"Bla bla bla M11 asdasdd

                    dsflksd j M12 dsfklfsdfs",
            };
            IDictionary<string, Observation> observationsMap = reportTextManager.Parse(obsSession);
            Assert.That(observationsMap.Count, Is.EqualTo(2));
        }

        [Test]
        public void testParsing3()
        {
            ReportTextManager reportTextManager = new ReportTextManager(null, null, obsRepoMock.Object, null, null);
            ObsSession obsSession = new ObsSession
            {
                Id = 5,
                Date = DateTime.Now,
                ReportText =
                    @"
                    I had to look for the planetary nebula NGC 6567, but I failed to locate it. I didn’t even manage to locate the asterism of stars I wanted to use to locate it. I drew a little sketch of the nearby stars to be able to compare with later, but for now nothing. !!

                    Quickly checked out M18 again, nothing special to say.

                    M25 which I know has always been a favourite object from Sweden in my 8” reflector *is* pretty cool. Even at low magnification. Faint, but littered with stars.

                    Having soon done the whole lap around (M24), all I was left with now was NGC 6596, but I just couldn’t get a handle on it. There were two asterisms of stars that could be the object, but I was very uncertain about which one it was.

                    Just south right between (M24) and (M21) and (M8) was two open cluster close to a few bright stars so I decided to check those out as well before heading back. NGC 6568 was visible but not overly clear. There was a bunch of quite a few medium faint stars.

                    NGC 6583 I could just not see. !!

                    Having missed two objects very close to bright stars around the Pipe Nebula, and also not wanting to get two involved in the star fields south of the galactic plane tonight, I headed back to the three stars in a curved line just north of the Pipe Nebula. I tried locating NGC 6325 but felt like I failed to make a definitive observation. I had mistaken the object for a planetary nebula when in fact it is a globular cluster, and I did write down that I thought I saw something faint and large, but I was far from certain. I made a sketch of the star field in order to identify it later, and it did turn out to be correct.

                    NGC 6369 *was* a planetary nebula though and I found it using the OIII method. Otherwise I think it would have been hard to find. I didn’t see any details, but it was fairly easy to find. Apparently it’s called the Little Ghost Nebula.

                    Last object in this area, NGC 6401 was super faint. I think I saw it at 35x, and nothing at 17x. If I did see it it must be very faint. Also I seemingly completely missed (B81), (B82) and (B83) which are small dark nebulas just around it. It does look pretty impressive on observatory pictures though with some dark nebulas just . Need to revisit.

                    Right at the eastern side of the Pipe Nebula is the globular cluster Pal 6 but I failed to locate it with any certainty. Maybe I saw a large diffuse blob. I should spend more time here, I felt I was a bit too fast. On the other hand I read that someone with a 15” scope, though with light pollution and low on the horizon failed to see it. Should revisit.

                    Now I went south-east of the Pipe Nebula to try to locate the galactic center. I had never been this close to it ever so I had to give it a chance, and just see what’s there. I found Cr 347 and group of stars that I used to try to locate the area but the stars didn’t quite match up with what I was expecting, so I drew a sketch of the area for later investigation. Cr 347 was small and faint by the way. When I came home it turned out I had missed the mark slightly because I had misread the stars on the atlas, not so strange given that they almost didn’t go that deep.

                    Now crossing the border of the galactic plane, but still just on the galactic north side in the dark side, forming a skewed square with (Cr 347) was three other clusters, Cr 351, NGC 6451, and NGC 6476.

                    NGC 6425 was most easily found by following a line through an asterism on the east side that looks like an arrow with (NGC 6451) right behind three stars that points right at NGC 6425.

                    And then if you continue twice further you get to NGC 6416, and then finally M6, which dominates that really dark area of the Milky Way south of the Pipe Nebula. In my notes I’ve said that close to NGC 6416 is like two small clusters separated as in a pie slice kind of way, if not only one is NGC 6416. Not sure what I meant. There are two lines of stars, one in the southern part of the cluster, and one almost outside on the east side. Maybe that’s what I meant. M6 is a big brother, and a very typical open cluster.

                    Just south-west of (M6) is Tr 28 which kind of stands out with two faint stars and then an almost nebulosity like field of probably fainter stars in the background that can hardly be seen at 25x at least. Could not find any photos of it online, just looks super scattered.

                    NGC 6374 is completely different in the eyepiece. One pretty bright star and then a bunch of fainter stars that hardly look connected to that brighter star.
                    ",
            };

            IDictionary<string, Observation> observationsMap = reportTextManager.Parse(obsSession);

            Assert.That(observationsMap.Count, Is.EqualTo(16));
        }

        [Test]
        public void testParsing5()
        {
            ReportTextManager reportTextManager = new ReportTextManager(null, null, obsRepoMock.Object, null, null);
            ObsSession obsSession = new ObsSession
            {
                Id = 5,
                Date = DateTime.Now,
                ReportText =
                    @"This Tr 28 one should match.

                    NGC 6374 This one should match


                    NGC 6374 This one should match

                    This one NGC 342 should match.

                    xxxxxxx xxxxxx xxxx xxxxxxx

                    This one NGC 342 should match.

                    This one NGC 342 should match.
                    Link: as one

                    This one NGC 342 should match.
                    ***
                    Link: as one

                    This oneNGC 123 should not match.
                    ",
            };
            IDictionary<string, Observation> observationsMap = reportTextManager.Parse(obsSession);
            Assert.That(observationsMap.Count, Is.EqualTo(7));
        }

        [Test]
        public void testParsing6()
        {
            ReportTextManager reportTextManager = new ReportTextManager(null, null, obsRepoMock.Object, null, null);
            ObsSession obsSession = new ObsSession
            {
                Id = 5,
                Date = DateTime.Now,
                ReportText =
                    @"This Tr 28 one should match.

                    NGC 6374 This one should match.

                    NGC 6374 This one should match
                    ",
            };
            IDictionary<string, Observation> observationsMap = reportTextManager.Parse(obsSession);
            Assert.That(observationsMap.Count, Is.EqualTo(3));
        }

        [Test]
        public void testParsingObjectsInParenthesis()
        {
            ReportTextManager reportTextManager = new ReportTextManager(null, null, obsRepoMock.Object, null, null);
            ObsSession obsSession = new ObsSession
            {
                Id = 5,
                Date = DateTime.Now,
                ReportText =
                    @"This Tr 28 one should match.

                    (NGC 6374) should not match.

                    NGC 6374 and M51 and (M67) and (M 42) should only have two observations not four.
                    ",
            };
            var observationsMap = reportTextManager.Parse(obsSession);
            Assert.That(observationsMap.GetAt(0).Value.DsoObservations.Count, Is.EqualTo(1));
            Assert.That(observationsMap.GetAt(0).Key, Is.EqualTo("5-0"));
            Assert.That(observationsMap.GetAt(1).Value.DsoObservations.Count, Is.EqualTo(2));
            Assert.That(observationsMap.GetAt(1).Key, Is.EqualTo("5-1-2"));
        }

        [Test]
        public void testParsingGroups()
        {
            ReportTextManager reportTextManager = new ReportTextManager(null, null, obsRepoMock.Object, null, null);
            ObsSession obsSession = new ObsSession
            {
                Id = 5,
                Date = DateTime.Now,
                ReportText =
                    @"This Tr 28 one should match.

                    This is an observation of NGC 6374 and M51.

                    And then we have NGC 6374 and NGC342 and NGC 981. This one should match.
                    ",
            };
            var observationsMap = reportTextManager.Parse(obsSession);
            Assert.That(observationsMap.Values.Count, Is.EqualTo(3));

            Assert.That(observationsMap.GetAt(0).Key, Is.EqualTo("5-0"));
            Assert.That(observationsMap.GetAt(0).Value.DisplayOrder, Is.EqualTo(0));
            Assert.That(observationsMap.GetAt(0).Value.DsoObservations.Count, Is.EqualTo(1));
            Assert.That(observationsMap.GetAt(0).Value.DsoObservations[0].Dso.Name,     Is.EqualTo("Tr 28"));
            Assert.That(observationsMap.GetAt(0).Value.DsoObservations[0].DisplayOrder, Is.EqualTo(0));

            Assert.That(observationsMap.GetAt(1).Key, Is.EqualTo("5-1-2"));
            Assert.That(observationsMap.GetAt(1).Value.DisplayOrder, Is.EqualTo(1));
            Assert.That(observationsMap.GetAt(1).Value.DsoObservations.Count, Is.EqualTo(2));
            Assert.That(observationsMap.GetAt(1).Value.DsoObservations[0].Dso.Name,     Is.EqualTo("NGC 6374"));
            Assert.That(observationsMap.GetAt(1).Value.DsoObservations[0].DisplayOrder, Is.EqualTo(0));
            Assert.That(observationsMap.GetAt(1).Value.DsoObservations[1].Dso.Name,     Is.EqualTo("M 51"));
            Assert.That(observationsMap.GetAt(1).Value.DsoObservations[1].DisplayOrder, Is.EqualTo(1));

            Assert.That(observationsMap.GetAt(2).Key, Is.EqualTo("5-3-4-5"));
            Assert.That(observationsMap.GetAt(2).Value.DisplayOrder, Is.EqualTo(2));
            Assert.That(observationsMap.GetAt(2).Value.DsoObservations.Count, Is.EqualTo(3));
            Assert.That(observationsMap.GetAt(2).Value.DsoObservations[0].Dso.Name,     Is.EqualTo("NGC 6374"));
            Assert.That(observationsMap.GetAt(2).Value.DsoObservations[0].DisplayOrder, Is.EqualTo(0));
            Assert.That(observationsMap.GetAt(2).Value.DsoObservations[1].Dso.Name,     Is.EqualTo("NGC 342"));
            Assert.That(observationsMap.GetAt(2).Value.DsoObservations[1].DisplayOrder, Is.EqualTo(1));
            Assert.That(observationsMap.GetAt(2).Value.DsoObservations[2].Dso.Name,     Is.EqualTo("NGC 981"));
            Assert.That(observationsMap.GetAt(2).Value.DsoObservations[2].DisplayOrder, Is.EqualTo(2));
        }

        [TestCase("M 31 (NGC 981) was bright.")]
        [TestCase("Found M 31 but not (NGC 981).")]
        [TestCase("Found M 31 but not (NGC 981)")]
        [TestCase("(NGC 981) could not be found but M 31 was")]
        //[TestCase("(NGC 981) could not be found but I did find M 31")]  // fails
        [TestCase("(NGC 981) could not be found but I did find M 31.")]
        public void testParenthesisSkipped(string reportText)
        {
            ReportTextManager reportTextManager = new ReportTextManager(null, null, obsRepoMock.Object, null, null);
            ObsSession obsSession = new ObsSession
            {
                Id = 5,
                Date = DateTime.Now,
                ReportText = reportText,
            };
            var observationsMap = reportTextManager.Parse(obsSession);
            Assert.That(observationsMap.Count, Is.EqualTo(1));
            Assert.That(observationsMap.GetAt(0).Value.DsoObservations.Count, Is.EqualTo(1));
            Assert.That(observationsMap.GetAt(0).Value.DsoObservations[0].Dso.Name, Is.EqualTo("M 31"));
        }

        [Test]
        public void testLowercaseCatalogNamesAreCanonicalizedBeforeLookup()
        {
            ReportTextManager reportTextManager = new ReportTextManager(null, null, obsRepoMock.Object, null, null);
            ObsSession obsSession = new ObsSession
            {
                Id = 5,
                Date = DateTime.Now,
                ReportText = "klsdlk m100 sdflkj m101",
            };

            var observationsMap = reportTextManager.Parse(obsSession);

            Assert.That(observationsMap.Count, Is.EqualTo(1));
            Assert.That(observationsMap.GetAt(0).Key, Is.EqualTo("5-0-1"));
            Assert.That(observationsMap.GetAt(0).Value.DsoObservations[0].Dso.Name, Is.EqualTo("M 100"));
            Assert.That(observationsMap.GetAt(0).Value.DsoObservations[1].Dso.Name, Is.EqualTo("M 101"));
        }

        [Test]
        public void testUnmatchedDsoCreatesObservationWithIdentifierToken()
        {
            obsRepoMock.Setup(x => x.GetDsoByName("NGC 34534", false)).Returns((Dso)null);
            ReportTextManager reportTextManager = new ReportTextManager(null, null, obsRepoMock.Object, null, null);
            ObsSession obsSession = new ObsSession
            {
                Id = 5,
                Date = DateTime.Now,
                ReportText = "NGC 34534 ldkf lsdkfj lskdflksdf slkdfj.",
            };

            var observationsMap = reportTextManager.Parse(obsSession);

            Assert.That(observationsMap.Count, Is.EqualTo(1));
            Assert.That(observationsMap.GetAt(0).Key, Is.EqualTo("5-!NGC34534!"));
            Assert.That(observationsMap.GetAt(0).Value.DsoObservations.Count, Is.EqualTo(0));
            Assert.That(obsSession.ReportText, Does.Contain("#5-!NGC34534!"));
        }

        [Test]
        public void testMixedMatchedAndUnmatchedDsoIdentifierToken()
        {
            obsRepoMock.Setup(x => x.GetDsoByName("NGC 34534", false)).Returns((Dso)null);
            ReportTextManager reportTextManager = new ReportTextManager(null, null, obsRepoMock.Object, null, null);
            ObsSession obsSession = new ObsSession
            {
                Id = 5,
                Date = DateTime.Now,
                ReportText = "M 31 and NGC 34534 were in the same section.",
            };

            var observationsMap = reportTextManager.Parse(obsSession);

            Assert.That(observationsMap.Count, Is.EqualTo(1));
            Assert.That(observationsMap.GetAt(0).Key, Is.EqualTo("5-0-!NGC34534!"));
            Assert.That(observationsMap.GetAt(0).Value.DsoObservations.Count, Is.EqualTo(1));
            Assert.That(observationsMap.GetAt(0).Value.DsoObservations[0].Dso.Name, Is.EqualTo("M 31"));
            Assert.That(obsSession.ReportText, Does.Contain("#5-0-!NGC34534!"));
        }

        [Test]
        public void testOtherAndUserObjectsCreateTypedIdentifierTokens()
        {
            using var connection = new SqliteConnection("Filename=:memory:");
            connection.Open();
            using var dbContext = CreateObjectParserContext(connection);
            dbContext.OtherObjects.Add(new OtherObject { Id = 10, Name = "Jupiter", Type = "PLANET" });
            dbContext.UserObjects.Add(new UserObject { Id = 20, UserId = 1, Name = "Barnard's Star", Type = "STAR" });
            dbContext.SaveChanges();

            var reportTextManager = new ReportTextManager(
                dbContext,
                null,
                obsRepoMock.Object,
                null,
                null,
                null,
                new ObjectsRepo(dbContext));
            ObsSession obsSession = new ObsSession
            {
                Id = 5,
                UserId = 1,
                Date = DateTime.Now,
                ReportText = "M 31, Jupiter, and Barnard's Star were all observed.",
            };

            var observationsMap = reportTextManager.Parse(obsSession);

            Assert.That(observationsMap.Count, Is.EqualTo(1));
            Assert.That(observationsMap.GetAt(0).Key, Is.EqualTo("5-0-[Jupiter]-{Barnard's Star}"));
            Assert.That(observationsMap.GetAt(0).Value.DsoObservations.Count, Is.EqualTo(3));
            Assert.That(observationsMap.GetAt(0).Value.DsoObservations.Any(dsoObs => dsoObs.DsoId == 0), Is.True);
            Assert.That(observationsMap.GetAt(0).Value.DsoObservations.Any(dsoObs => dsoObs.OtherObjectId == 10), Is.True);
            Assert.That(observationsMap.GetAt(0).Value.DsoObservations.Any(dsoObs => dsoObs.UserObjectId == 20), Is.True);
            Assert.That(obsSession.ReportText, Does.Contain("#5-0-[Jupiter]-{Barnard's Star}"));
        }

        /// <summary>
        /// Verifies that contextual non-SAC object mentions can be ignored the same way SAC mentions can.
        /// </summary>
        [Test]
        public void testParenthesizedOtherAndUserObjectMentionsAreIgnored()
        {
            using var connection = new SqliteConnection("Filename=:memory:");
            connection.Open();
            using var dbContext = CreateObjectParserContext(connection);
            dbContext.OtherObjects.Add(new OtherObject { Id = 10, Name = "Jupiter", Type = "PLANET" });
            dbContext.UserObjects.Add(new UserObject { Id = 20, UserId = 1, Name = "Barnard's Star", Type = "STAR" });
            dbContext.SaveChanges();

            var reportTextManager = new ReportTextManager(
                dbContext,
                null,
                obsRepoMock.Object,
                null,
                null,
                null,
                new ObjectsRepo(dbContext));
            ObsSession obsSession = new ObsSession
            {
                Id = 5,
                UserId = 1,
                Date = DateTime.Now,
                ReportText = "Two steps before (Jupiter) and (Barnard's Star) I looked at M 31.\r\n\r\nThen I looked at Jupiter and Barnard's Star.",
            };

            var observationsMap = reportTextManager.Parse(obsSession);

            Assert.That(observationsMap.Count, Is.EqualTo(2));
            Assert.That(observationsMap.GetAt(0).Key, Is.EqualTo("5-0"));
            Assert.That(observationsMap.GetAt(0).Value.DsoObservations.Count, Is.EqualTo(1));
            Assert.That(observationsMap.GetAt(0).Value.DsoObservations[0].Dso.Name, Is.EqualTo("M 31"));
            Assert.That(observationsMap.GetAt(1).Key, Is.EqualTo("5-[Jupiter]-{Barnard's Star}"));
            Assert.That(observationsMap.GetAt(1).Value.DsoObservations.Count, Is.EqualTo(2));
            Assert.That(observationsMap.GetAt(1).Value.DsoObservations.Any(dsoObs => dsoObs.OtherObjectId == 10), Is.True);
            Assert.That(observationsMap.GetAt(1).Value.DsoObservations.Any(dsoObs => dsoObs.UserObjectId == 20), Is.True);
        }

        [Test]
        public void testUserObjectWinsWhenNameAlsoLooksLikeSacObject()
        {
            using var connection = new SqliteConnection("Filename=:memory:");
            connection.Open();
            using var dbContext = CreateObjectParserContext(connection);
            dbContext.UserObjects.Add(new UserObject { Id = 20, UserId = 1, Name = "M 31", Type = "ASTER" });
            dbContext.OtherObjects.Add(new OtherObject { Id = 10, Name = "M 31", Type = "PLANET" });
            dbContext.SaveChanges();

            var reportTextManager = new ReportTextManager(
                dbContext,
                null,
                obsRepoMock.Object,
                null,
                null,
                null,
                new ObjectsRepo(dbContext));
            ObsSession obsSession = new ObsSession
            {
                Id = 5,
                UserId = 1,
                Date = DateTime.Now,
                ReportText = "M 31 was recorded as my custom target.",
            };

            var observationsMap = reportTextManager.Parse(obsSession);

            Assert.That(observationsMap.GetAt(0).Key, Is.EqualTo("5-{M 31}"));
            Assert.That(observationsMap.GetAt(0).Value.DsoObservations.Count, Is.EqualTo(1));
            Assert.That(observationsMap.GetAt(0).Value.DsoObservations[0].UserObjectId, Is.EqualTo(20));
            Assert.That(observationsMap.GetAt(0).Value.DsoObservations[0].DsoId, Is.Null);
            Assert.That(observationsMap.GetAt(0).Value.DsoObservations[0].OtherObjectId, Is.Null);
        }

        private MainDbContext CreateObjectParserContext(SqliteConnection connection)
        {
            var options = new DbContextOptionsBuilder<MainDbContext>()
                .UseSqlite(connection)
                .Options;
            var dbContext = new MainDbContext(options, new Mock<ILogger<MainDbContext>>().Object);
            dbContext.Database.EnsureCreated();
            dbContext.Users.Add(new AppUser
            {
                Id = 1,
                Email = "observer@example.test",
                NormalizedEmail = "OBSERVER@EXAMPLE.TEST",
                FullName = "Observer",
                PasswordHash = "hash",
                CreatedUtc = DateTime.UtcNow
            });
            dbContext.SaveChanges();
            return dbContext;
        }


        [TestCase("Found M 31. Did not find !NGC 206!.")]
        //[TestCase("Found M 31. Did not find !NGC 206!")]  // fails
        [TestCase("Did not find !NGC 206! but I did find M 31.")]
        public void testSingleDsoNonDetection(string reportText)
        {
            ReportTextManager reportTextManager = new ReportTextManager(null, null, obsRepoMock.Object, null, null);
            ObsSession obsSession = new ObsSession
            {
                Id = 5,
                Date = DateTime.Now,
                ReportText = reportText,
            };
            var observationsMap = reportTextManager.Parse(obsSession);
            Assert.That(observationsMap.Count, Is.EqualTo(1));
            var obs = observationsMap.GetAt(0).Value;
            Assert.That(obs.NonDetection, Is.False);
            Assert.That(obs.DsoObservations.Count, Is.EqualTo(2));
            var m31DsoObs = obs.DsoObservations.First(d => d.Dso.Name == "M 31");
            var ngc206DsoObs = obs.DsoObservations.First(d => d.Dso.Name == "NGC 206");
            Assert.That(m31DsoObs.NonDetection, Is.False);
            Assert.That(ngc206DsoObs.NonDetection, Is.True);
        }

        [TestCase("Did not find !NGC 206! and also failed to see !M 31!.")]
        [TestCase("Did not find !NGC 206! and also failed to see !M 31!.")]
        public void testMultipleDsoNonDetection(string reportText)
        {
            ReportTextManager reportTextManager = new ReportTextManager(null, null, obsRepoMock.Object, null, null);
            ObsSession obsSession = new ObsSession
            {
                Id = 5,
                Date = DateTime.Now,
                ReportText = reportText,
            };
            var observationsMap = reportTextManager.Parse(obsSession);

            // Check that non-detection is also stored on the Observation group
            Assert.That(observationsMap.Count, Is.EqualTo(1));
            var obs = observationsMap.GetAt(0).Value;
            Assert.That(obs.NonDetection, Is.True);

            // Check each individual object
            Assert.That(obs.DsoObservations.Count, Is.EqualTo(2));
            var ngc206DsoObs = obs.DsoObservations.First(d => d.Dso.Name == "NGC 206");
            var m31DsoObs = obs.DsoObservations.First(d => d.Dso.Name == "M 31");
            Assert.That(ngc206DsoObs.NonDetection, Is.True);
            Assert.That(m31DsoObs.NonDetection, Is.True);
        }

        [TestCase("!! Could not find NGC 206.")]
        [TestCase("Could not find NGC 206 !!")]
        //[TestCase("Could not find it !! NGC 206")]  // fails
        [TestCase("Could not find NGC 206. !!")]
        public void testObservationGroupNonDetectionWorks(string reportText)
        {
            ReportTextManager reportTextManager = new ReportTextManager(null, null, obsRepoMock.Object, null, null);
            ObsSession obsSession = new ObsSession
            {
                Id = 5,
                Date = DateTime.Now,
                ReportText = reportText,
            };
            var observationsMap = reportTextManager.Parse(obsSession);
            Assert.That(observationsMap.Count, Is.EqualTo(1));
            var obs = observationsMap.GetAt(0).Value;
            Assert.That(obs.NonDetection, Is.True);
            Assert.That(obs.DsoObservations.Count, Is.EqualTo(1));
            Assert.That(obs.DsoObservations[0].NonDetection, Is.True);
        }

        [TestCase("!! Looked for !NGC 206!.")]
        [TestCase("Looked for !NGC 981!. !!")]
        public void testSectionAndDsoNonDetectionConflict(string reportText)
        {
            ReportTextManager reportTextManager = new ReportTextManager(null, null, obsRepoMock.Object, null, null);
            ObsSession obsSession = new ObsSession
            {
                Id = 5,
                Date = DateTime.Now,
                ReportText = reportText,
            };
            Assert.Throws<ObsToolException>(() => reportTextManager.Parse(obsSession));
        }

        [TestCase("Looked for !NGC 206 hard.")]
        [TestCase("Looked for NGC 206! hard.")]
        [TestCase("NGC 206! was tricky.")]
        [TestCase("!NGC 206 was tricky.")]
        public void testUnmatchedNonDetectionMarker(string reportText)
        {
            ReportTextManager reportTextManager = new ReportTextManager(null, null, obsRepoMock.Object, null, null);
            ObsSession obsSession = new ObsSession
            {
                Id = 5,
                Date = DateTime.Now,
                ReportText = reportText,
            };
            Assert.Throws<ObsToolException>(() => reportTextManager.Parse(obsSession));
        }

        [Test]
        public void testInstrumentFromObsSessionUsedWhenNoInstrumentKey()
        {
            var instrumentsRepoMock = new Mock<IInstrumentsRepo>();
            ReportTextManager reportTextManager = new ReportTextManager(null, null, obsRepoMock.Object, null, null, instrumentsRepoMock.Object);
            ObsSession obsSession = new ObsSession
            {
                Id = 5,
                Date = DateTime.Now,
                InstrumentId = 77,
                ReportText =
                    @"M 31 looked bright.

                    NGC 206 was tricky."
            };

            var observationsMap = reportTextManager.Parse(obsSession);
            Assert.That(observationsMap.Count, Is.EqualTo(2));
            Assert.That(observationsMap.Values.All(o => o.InstrumentId == 77), Is.True);
        }

        [Test]
        public void testInstrumentKeyParagraphOverridesInstrumentForFollowingObservations()
        {
            var instrumentsRepoMock = new Mock<IInstrumentsRepo>();
            instrumentsRepoMock.Setup(x => x.GetInstruments(1)).Returns(new List<Instrument>
            {
                new Instrument { Id = 10, Key = "Dob10" },
                new Instrument { Id = 20, Key = "ED80" }
            });

            ReportTextManager reportTextManager = new ReportTextManager(null, null, obsRepoMock.Object, null, null, instrumentsRepoMock.Object);
            ObsSession obsSession = new ObsSession
            {
                Id = 5,
                Date = DateTime.Now,
                UserId = 1,
                InstrumentId = 77,
                ReportText =
                    @"M 31 first object.

                    I switched over to the Dob10 for the rest of the night.

                    NGC 206 second object.

                    For the wide-field scan I used ED80 tonight.

                    M 42 third object."
            };

            var observationsMap = reportTextManager.Parse(obsSession);
            Assert.That(observationsMap.Count, Is.EqualTo(3));
            Assert.That(observationsMap.GetAt(0).Value.InstrumentId, Is.EqualTo(77));
            Assert.That(observationsMap.GetAt(1).Value.InstrumentId, Is.EqualTo(10));
            Assert.That(observationsMap.GetAt(2).Value.InstrumentId, Is.EqualTo(20));
        }

        [Test]
        public void testInstrumentKeyInObservationParagraphOverridesInstrumentForThatSectionAndFollowingSections()
        {
            var instrumentsRepoMock = new Mock<IInstrumentsRepo>();
            instrumentsRepoMock.Setup(x => x.GetInstruments(1)).Returns(new List<Instrument>
            {
                new Instrument { Id = 10, Key = "Dob10" }
            });

            ReportTextManager reportTextManager = new ReportTextManager(null, null, obsRepoMock.Object, null, null, instrumentsRepoMock.Object);
            ObsSession obsSession = new ObsSession
            {
                Id = 5,
                Date = DateTime.Now,
                UserId = 1,
                InstrumentId = 77,
                ReportText =
                    @"M 31 first object through Dob10.

                    NGC 206 second object."
            };

            var observationsMap = reportTextManager.Parse(obsSession);
            Assert.That(observationsMap.Count, Is.EqualTo(2));
            Assert.That(observationsMap.GetAt(0).Value.InstrumentId, Is.EqualTo(10));
            Assert.That(observationsMap.GetAt(1).Value.InstrumentId, Is.EqualTo(10));
        }

        [TestCase("ED80. M 31 first object.")]
        [TestCase("M 31 first object. So for example ED80.")]
        public void testInstrumentKeyCanStartOrEndSentenceInObservationParagraph(string firstSectionText)
        {
            var instrumentsRepoMock = new Mock<IInstrumentsRepo>();
            instrumentsRepoMock.Setup(x => x.GetInstruments(1)).Returns(new List<Instrument>
            {
                new Instrument { Id = 20, Key = "ED80" }
            });

            ReportTextManager reportTextManager = new ReportTextManager(null, null, obsRepoMock.Object, null, null, instrumentsRepoMock.Object);
            ObsSession obsSession = new ObsSession
            {
                Id = 5,
                Date = DateTime.Now,
                UserId = 1,
                InstrumentId = 77,
                ReportText = firstSectionText + "\r\n\r\nNGC 206 second object."
            };

            var observationsMap = reportTextManager.Parse(obsSession);
            Assert.That(observationsMap.Count, Is.EqualTo(2));
            Assert.That(observationsMap.GetAt(0).Value.InstrumentId, Is.EqualTo(20));
            Assert.That(observationsMap.GetAt(1).Value.InstrumentId, Is.EqualTo(20));
        }

        [Test]
        public void testInstrumentKeyMustBeItsOwnWord()
        {
            var instrumentsRepoMock = new Mock<IInstrumentsRepo>();
            instrumentsRepoMock.Setup(x => x.GetInstruments(1)).Returns(new List<Instrument>
            {
                new Instrument { Id = 10, Key = "Dob10" }
            });

            ReportTextManager reportTextManager = new ReportTextManager(null, null, obsRepoMock.Object, null, null, instrumentsRepoMock.Object);
            ObsSession obsSession = new ObsSession
            {
                Id = 5,
                Date = DateTime.Now,
                UserId = 1,
                InstrumentId = 77,
                ReportText =
                    @"M 31 first object.

                    This Dob10ish text should not switch instruments.

                    NGC 206 second object."
            };

            var observationsMap = reportTextManager.Parse(obsSession);
            Assert.That(observationsMap.Count, Is.EqualTo(2));
            Assert.That(observationsMap.Values.All(o => o.InstrumentId == 77), Is.True);
        }

        [Test]
        public void testInstrumentWithoutKeyIsIgnoredByParser()
        {
            // Keyless instruments are session labels only and must not participate in report-text directive checks.
            var instrumentsRepoMock = new Mock<IInstrumentsRepo>();
            instrumentsRepoMock.Setup(x => x.GetInstruments(1)).Returns(new List<Instrument>
            {
                new Instrument { Id = 10, Key = null, Name = "Dual instrument setup" },
                new Instrument { Id = 20, Key = "", Name = "Blank key setup" },
                new Instrument { Id = 30, Key = "ED80", Name = "ED80" }
            });

            ReportTextManager reportTextManager = new ReportTextManager(null, null, obsRepoMock.Object, null, null, instrumentsRepoMock.Object);
            ObsSession obsSession = new ObsSession
            {
                Id = 5,
                Date = DateTime.Now,
                UserId = 1,
                InstrumentId = 77,
                ReportText =
                    @"M 31 first object with the Dual instrument setup.

                    NGC 206 second object."
            };

            var observationsMap = reportTextManager.Parse(obsSession);
            Assert.That(observationsMap.Count, Is.EqualTo(2));
            Assert.That(observationsMap.Values.All(o => o.InstrumentId == 77), Is.True);
        }

    }
}
