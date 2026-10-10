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

        /// <summary>
        /// Verifies that a catalog object followed immediately by a colon starts an observation section.
        /// </summary>
        [Test]
        public void testParsingObjectNameFollowedByColon()
        {
            ReportTextManager reportTextManager = new ReportTextManager(null, null, obsRepoMock.Object, null, null);
            ObsSession obsSession = new ObsSession
            {
                Id = 5,
                Date = DateTime.Now,
                ReportText = "M83: Bla bla bla",
            };

            var observationsMap = reportTextManager.Parse(obsSession);

            Assert.That(observationsMap.Count, Is.EqualTo(1));
            Assert.That(observationsMap.GetAt(0).Value.DsoObservations.Single().Dso.Name, Is.EqualTo("M 83"));
        }

        /// <summary>
        /// Keeps a number in the next sentence out of the preceding galaxy designation, including on reparse.
        /// </summary>
        [TestCase("")]
        [TestCase("\r\n#140-1256-!NGC23002276!")]
        public void testGalaxyNumbersAfterSentenceEndingPeriod(string identifierSuffix)
        {
            // Resolve only the two actual galaxies so an overlong designation cannot pass as a catalog match.
            obsRepoMock.Setup(x => x.GetDsoByName(It.IsAny<string>(), false)).Returns((Dso)null);
            obsRepoMock.Setup(x => x.GetDsoByName("NGC 2276", false))
                .Returns(new Dso { Id = 1256, Name = "NGC 2276" });
            obsRepoMock.Setup(x => x.GetDsoByName("NGC 2300", false))
                .Returns(new Dso { Id = 1257, Name = "NGC 2300" });
            var reportTextManager = new ReportTextManager(null, null, obsRepoMock.Object, null, null);
            var obsSession = new ObsSession
            {
                Id = 140,
                Date = DateTime.Now,
                ReportText = "Down another declination from the north celestial pole was a group of galaxies, "
                    + "NGC 2276, NGC 2300. 2276 was bigger and fainter. 2300 smaller and brighter. "
                    + "Saw it more or less with direct vision." + identifierSuffix
            };

            var observationsMap = reportTextManager.Parse(obsSession);

            Assert.That(observationsMap.Count, Is.EqualTo(1));
            var observation = observationsMap.Single().Value;
            Assert.That(observation.DsoObservations.Select(dsoObs => dsoObs.Dso.Name),
                Is.EqualTo(new[] { "NGC 2276", "NGC 2300" }));
            Assert.That(observation.NonDetection, Is.False);
            obsRepoMock.Verify(x => x.GetDsoByName("NGC 2300. 2276", false), Times.Never);

            // Existing identifiers remain stable; a new report uses the two resolved object IDs.
            string expectedIdentifier = string.IsNullOrEmpty(identifierSuffix)
                ? "140-1256-1257"
                : "140-1256-!NGC23002276!";
            Assert.That(observation.Identifier, Is.EqualTo(expectedIdentifier));
            string parsedReportText = obsSession.ReportText;
            var reparsedObservation = reportTextManager.Parse(obsSession).Single().Value;
            Assert.That(reparsedObservation.Identifier, Is.EqualTo(expectedIdentifier));
            Assert.That(reparsedObservation.DsoObservations.Select(dsoObs => dsoObs.Dso.Name),
                Is.EqualTo(new[] { "NGC 2276", "NGC 2300" }));
            Assert.That(obsSession.ReportText, Is.EqualTo(parsedReportText));
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

        /// <summary>
        /// Keeps ordinary conjunctions out of catalog matching while retaining case-insensitive M and NGC names.
        /// </summary>
        [TestCase("I observed M31 and M32. 31 was cool and 32 was fainter.", new[] { "M 31", "M 32" })]
        [TestCase("ngc 123 And 32 was fainter.", new[] { "NGC 123" })]
        [TestCase("and 32 was fainter.", new string[0])]
        [TestCase("And 32 was fainter.", new string[0])]
        [TestCase("aNd 32 was fainter.", new string[0])]
        public void testAndCatalogIgnoresOrdinaryProse(string reportText, string[] expectedNames)
        {
            obsRepoMock.Setup(x => x.GetAllCatalogs()).Returns(new List<string> { "M", "NGC", "AND" });
            obsRepoMock.Setup(x => x.GetDsoByName("AND 32", false)).Returns((Dso)null);
            var reportTextManager = new ReportTextManager(null, null, obsRepoMock.Object, null, null);
            var obsSession = new ObsSession { Id = 5, ReportText = reportText };

            var observationsMap = reportTextManager.Parse(obsSession);

            Assert.That(observationsMap.Count, Is.EqualTo(expectedNames.Length == 0 ? 0 : 1));
            Assert.That(observationsMap.Values.SelectMany(o => o.DsoObservations).Select(o => o.Dso.Name),
                Is.EqualTo(expectedNames));
            obsRepoMock.Verify(x => x.GetDsoByName("AND 32", false), Times.Never);
            Assert.That(obsSession.ReportText, Does.Not.Contain("!AND32!"));
        }

        /// <summary>
        /// Retains explicit uppercase AND references, including the unidentified-object behavior for unknown numbers.
        /// </summary>
        [TestCase("AND 32 was faint.")]
        [TestCase("AND32 was faint.")]
        public void testUppercaseAndCatalogStillMatches(string reportText)
        {
            obsRepoMock.Setup(x => x.GetAllCatalogs()).Returns(new List<string> { "AND" });
            obsRepoMock.Setup(x => x.GetDsoByName("AND 32", false)).Returns((Dso)null);
            var reportTextManager = new ReportTextManager(null, null, obsRepoMock.Object, null, null);
            var obsSession = new ObsSession { Id = 5, ReportText = reportText };

            var observationsMap = reportTextManager.Parse(obsSession);

            Assert.That(observationsMap.Count, Is.EqualTo(1));
            Assert.That(observationsMap.GetAt(0).Key, Is.EqualTo("5-!AND32!"));
            obsRepoMock.Verify(x => x.GetDsoByName("AND 32", false), Times.Once);
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
                ReportText = "!M 31! was recorded as my custom target.",
            };

            var observationsMap = reportTextManager.Parse(obsSession);

            Assert.That(observationsMap.GetAt(0).Key, Is.EqualTo("5-{M 31}"));
            Assert.That(observationsMap.GetAt(0).Value.DsoObservations.Count, Is.EqualTo(1));
            Assert.That(observationsMap.GetAt(0).Value.DsoObservations[0].UserObjectId, Is.EqualTo(20));
            Assert.That(observationsMap.GetAt(0).Value.DsoObservations[0].DsoId, Is.Null);
            Assert.That(observationsMap.GetAt(0).Value.DsoObservations[0].OtherObjectId, Is.Null);
            Assert.That(observationsMap.GetAt(0).Value.DsoObservations[0].NonDetection, Is.True);
        }

        /// <summary>
        /// Verifies individual non-detections for stored names, including repeated mentions and compact variants.
        /// </summary>
        [TestCase("Tried to see G305 and !A49!. Never saw !A49!.", false)]
        [TestCase("!A49!", true)]
        [TestCase("Never saw !A 49!.", true)]
        [TestCase("Tried to see G305 and !A49!. Never saw !A49!.", false, true)]
        [TestCase("!A49!", true, true)]
        public void testNamedObjectNonDetection(string reportText, bool expectedSectionNonDetection, bool sharedObject = false)
        {
            using var connection = new SqliteConnection("Filename=:memory:");
            connection.Open();
            using var dbContext = CreateObjectParserContext(connection);
            dbContext.UserObjects.Add(new UserObject { Id = 20, UserId = 1, Name = "G305", Type = "ASTER" });
            if (sharedObject)
            {
                dbContext.OtherObjects.Add(new OtherObject { Id = 10, Name = "A 49", Type = "ASTER" });
            }
            else
            {
                dbContext.UserObjects.Add(new UserObject { Id = 21, UserId = 1, Name = "A 49", Type = "ASTER" });
            }
            dbContext.SaveChanges();

            var reportTextManager = new ReportTextManager(
                dbContext, null, obsRepoMock.Object, null, null, null, new ObjectsRepo(dbContext));
            var obsSession = new ObsSession { Id = 5, UserId = 1, Date = DateTime.Now, ReportText = reportText };

            // Reparse the injected identifier to ensure repeated mentions stay one stable object link.
            for (int pass = 0; pass < 2; pass++)
            {
                var observation = reportTextManager.Parse(obsSession).Values.Single();
                Assert.That(observation.NonDetection, Is.EqualTo(expectedSectionNonDetection));
                Assert.That(observation.DsoObservations.Count, Is.EqualTo(expectedSectionNonDetection ? 1 : 2));
                var target = observation.DsoObservations.Single(d => sharedObject ? d.OtherObjectId == 10 : d.UserObjectId == 21);
                Assert.That(target.NonDetection, Is.True);
                if (!expectedSectionNonDetection)
                {
                    Assert.That(observation.DsoObservations.Single(d => d.UserObjectId == 20).NonDetection, Is.False);
                }
            }
        }

        /// <summary>
        /// Ensures section markers remain distinct from individual markers for named objects.
        /// </summary>
        [TestCase("A49!!")]
        [TestCase("!! A49")]
        [TestCase("A49 !!")]
        public void testNamedObjectSectionNonDetection(string reportText)
        {
            using var connection = new SqliteConnection("Filename=:memory:");
            connection.Open();
            using var dbContext = CreateObjectParserContext(connection);
            dbContext.UserObjects.Add(new UserObject { Id = 20, UserId = 1, Name = "A49", Type = "ASTER" });
            dbContext.SaveChanges();
            var reportTextManager = new ReportTextManager(
                dbContext, null, obsRepoMock.Object, null, null, null, new ObjectsRepo(dbContext));
            var obsSession = new ObsSession { Id = 5, UserId = 1, Date = DateTime.Now, ReportText = reportText };

            var observation = reportTextManager.Parse(obsSession).Values.Single();

            Assert.That(observation.NonDetection, Is.True);
            Assert.That(observation.DsoObservations.Single().NonDetection, Is.True);
        }

        /// <summary>
        /// Rejects unbalanced or conflicting markers for custom names just as for catalog objects.
        /// </summary>
        [TestCase("!A49")]
        [TestCase("A49!")]
        [TestCase("!! Looked for !A49!.")]
        public void testNamedObjectInvalidNonDetectionMarkers(string reportText)
        {
            using var connection = new SqliteConnection("Filename=:memory:");
            connection.Open();
            using var dbContext = CreateObjectParserContext(connection);
            dbContext.UserObjects.Add(new UserObject { Id = 20, UserId = 1, Name = "A49", Type = "ASTER" });
            dbContext.SaveChanges();
            var reportTextManager = new ReportTextManager(
                dbContext, null, obsRepoMock.Object, null, null, null, new ObjectsRepo(dbContext));
            var obsSession = new ObsSession { Id = 5, UserId = 1, Date = DateTime.Now, ReportText = reportText };

            Assert.Throws<ObsToolException>(() => reportTextManager.Parse(obsSession));
        }

        /// <summary>
        /// Keeps a shorter overlapping name from interpreting the markers belonging to a longer target.
        /// </summary>
        [Test]
        public void testNamedObjectNonDetectionWithOverlappingNames()
        {
            using var connection = new SqliteConnection("Filename=:memory:");
            connection.Open();
            using var dbContext = CreateObjectParserContext(connection);
            dbContext.UserObjects.Add(new UserObject { Id = 20, UserId = 1, Name = "Barnard's Star", Type = "STAR" });
            dbContext.UserObjects.Add(new UserObject { Id = 21, UserId = 1, Name = "Star", Type = "STAR" });
            dbContext.OtherObjects.Add(new OtherObject { Id = 10, Name = "Barnard", Type = "STAR" });
            dbContext.SaveChanges();
            var reportTextManager = new ReportTextManager(
                dbContext, null, obsRepoMock.Object, null, null, null, new ObjectsRepo(dbContext));
            var obsSession = new ObsSession { Id = 5, UserId = 1, Date = DateTime.Now, ReportText = "!Barnard's Star!" };

            var observation = reportTextManager.Parse(obsSession).Values.Single();

            Assert.That(observation.DsoObservations.Single().UserObjectId, Is.EqualTo(20));
            Assert.That(observation.DsoObservations.Single().NonDetection, Is.True);
        }

        /// <summary>
        /// Replaces standalone constellation keywords and keeps the saved report and observation text in sync.
        /// </summary>
        [TestCase("M 31 in const tonight.", "M 31 in Andromeda tonight.")]
        [TestCase("M 31 in const, tonight.", "M 31 in Andromeda, tonight.")]
        [TestCase("M 31 in const.", "M 31 in Andromeda.")]
        [TestCase("M 31 in (const); constant stays.", "M 31 in (Andromeda); constant stays.")]
        public void testConstellationKeywordReplacement(string reportText, string expectedText)
        {
            using var connection = new SqliteConnection("Filename=:memory:");
            connection.Open();
            using var dbContext = CreateObjectParserContext(connection);
            dbContext.Constellations.Add(new Constellation("Andromeda", "AND"));
            dbContext.SaveChanges();
            obsRepoMock.Setup(x => x.GetDsoByName("M 31", false, 1))
                .Returns(new Dso { Id = 31, Name = "M 31", Con = "AND" });
            var reportTextManager = new ReportTextManager(
                dbContext, null, obsRepoMock.Object, null, null, null, new ObjectsRepo(dbContext));
            var obsSession = new ObsSession { Id = 5, UserId = 1, Date = DateTime.Now, ReportText = reportText };

            var observation = reportTextManager.Parse(obsSession).Values.Single();
            Assert.That(observation.Text, Is.EqualTo(expectedText));
            Assert.That(obsSession.ReportText, Does.StartWith(expectedText));
            Assert.That(obsSession.ReportText, Does.Not.Contain(" in const"));

            var reparsedObservation = reportTextManager.Parse(obsSession).Values.Single();
            Assert.That(reparsedObservation.Text, Is.EqualTo(expectedText));
        }

        /// <summary>
        /// Uses the constellations on shared and user objects as well as catalog objects.
        /// </summary>
        [Test]
        public void testConstellationKeywordWithAllObjectKinds()
        {
            using var connection = new SqliteConnection("Filename=:memory:");
            connection.Open();
            using var dbContext = CreateObjectParserContext(connection);
            dbContext.Constellations.Add(new Constellation("Andromeda", "AND"));
            dbContext.OtherObjects.Add(new OtherObject { Id = 10, Name = "Shared target", Const = "AND" });
            dbContext.UserObjects.Add(new UserObject { Id = 20, UserId = 1, Name = "Personal target", Const = "AND" });
            dbContext.SaveChanges();
            obsRepoMock.Setup(x => x.GetDsoByName("M 31", false, 1))
                .Returns(new Dso { Id = 31, Name = "M 31", Con = "AND" });
            var reportTextManager = new ReportTextManager(
                dbContext, null, obsRepoMock.Object, null, null, null, new ObjectsRepo(dbContext));
            var obsSession = new ObsSession
            {
                Id = 5, UserId = 1, Date = DateTime.Now,
                ReportText = "M 31, Shared target, and Personal target in const."
            };

            var observation = reportTextManager.Parse(obsSession).Values.Single();
            Assert.That(observation.Text, Is.EqualTo("M 31, Shared target, and Personal target in Andromeda."));
            Assert.That(observation.DsoObservations.Count, Is.EqualTo(3));
            Assert.That(obsSession.ReportText, Does.Not.Contain("const"));
        }

        /// <summary>
        /// Resolves each paragraph independently and permits a section containing only a custom object.
        /// </summary>
        [Test]
        public void testConstellationKeywordInSeparateSections()
        {
            using var connection = new SqliteConnection("Filename=:memory:");
            connection.Open();
            using var dbContext = CreateObjectParserContext(connection);
            dbContext.Constellations.Add(new Constellation("Andromeda", "AND"));
            dbContext.Constellations.Add(new Constellation("Orion", "ORI"));
            dbContext.UserObjects.Add(new UserObject { Id = 20, UserId = 1, Name = "Personal target", Const = "ORI" });
            dbContext.SaveChanges();
            obsRepoMock.Setup(x => x.GetDsoByName("M 31", false, 1))
                .Returns(new Dso { Id = 31, Name = "M 31", Con = "AND" });
            var reportTextManager = new ReportTextManager(
                dbContext, null, obsRepoMock.Object, null, null, null, new ObjectsRepo(dbContext));
            var obsSession = new ObsSession
            {
                Id = 5, UserId = 1, Date = DateTime.Now,
                ReportText = "M 31 in const.\r\n\r\nPersonal target in const, clearly."
            };

            var observations = reportTextManager.Parse(obsSession).Values.ToList();
            Assert.That(observations.Select(observation => observation.Text), Is.EqualTo(new[]
            {
                "M 31 in Andromeda.", "Personal target in Orion, clearly."
            }));
            Assert.That(obsSession.ReportText, Does.Contain("M 31 in Andromeda."));
            Assert.That(obsSession.ReportText, Does.Contain("Personal target in Orion, clearly."));
            Assert.That(obsSession.ReportText, Does.Not.Contain("const"));
        }

        /// <summary>
        /// Warns when the keyword cannot identify one constellation for the section.
        /// </summary>
        [TestCase("Nothing in const.", false)]
        [TestCase("M 31 and M 32 in const.", true)]
        public void testConstellationKeywordWarnings(string reportText, bool hasConflictingObjects)
        {
            using var connection = new SqliteConnection("Filename=:memory:");
            connection.Open();
            using var dbContext = CreateObjectParserContext(connection);
            dbContext.Constellations.Add(new Constellation("Andromeda", "AND"));
            dbContext.SaveChanges();
            obsRepoMock.Setup(x => x.GetDsoByName("M 31", false, 1))
                .Returns(new Dso { Id = 31, Name = "M 31", Con = "AND" });
            obsRepoMock.Setup(x => x.GetDsoByName("M 32", false, 1))
                .Returns(new Dso { Id = 32, Name = "M 32", Con = "ORI" });
            var reportTextManager = new ReportTextManager(
                dbContext, null, obsRepoMock.Object, null, null, null, new ObjectsRepo(dbContext));
            var obsSession = new ObsSession { Id = 5, UserId = 1, Date = DateTime.Now, ReportText = reportText };

            var warning = Assert.Throws<ObsToolException>(() => reportTextManager.Parse(obsSession));
            Assert.That(warning.Message, Does.StartWith("Warning:"));
            Assert.That(warning.Message, Does.Contain(hasConflictingObjects ? "same known constellation" : "recognized object"));
            Assert.That(obsSession.ReportText, Is.EqualTo(reportText));
        }

        /// <summary>
        /// Creates a personal object, removes the markers, and copies a peer constellation.
        /// </summary>
        [Test]
        public void InlinePersonalObjectIsCreatedAndLinked()
        {
            using var connection = new SqliteConnection("Filename=:memory:");
            connection.Open();
            using var dbContext = CreateObjectParserContext(connection);
            dbContext.Constellations.Add(new Constellation("Andromeda", "AND"));
            dbContext.SaveChanges();
            obsRepoMock.Setup(x => x.GetDsoByName("M 31", false, 1))
                .Returns(new Dso { Id = 31, Name = "M 31", Con = "AND" });
            var manager = new ReportTextManager(dbContext, null, obsRepoMock.Object, null, null, null, new ObjectsRepo(dbContext));
            var session = new ObsSession { Id = 5, UserId = 1, ReportText = "M 31 and >New nebula< in const." };

            var observation = manager.Parse(session).Values.Single();

            var created = dbContext.UserObjects.Single();
            Assert.That(created.Name, Is.EqualTo("New nebula"));
            Assert.That(created.Const, Is.EqualTo("AND"));
            Assert.That(observation.DsoObservations.Any(item => item.UserObjectId == created.Id), Is.True);
            Assert.That(session.ReportText, Does.Contain("New nebula"));
            Assert.That(session.ReportText, Does.Not.Contain(">"));
            Assert.That(session.ReportText, Does.Not.Contain("<"));
        }

        /// <summary>
        /// Recognizes a marked object even when it appears below the section's first line.
        /// </summary>
        [Test]
        public void InlineObjectInSectionBodyIsLinked()
        {
            using var connection = new SqliteConnection("Filename=:memory:");
            connection.Open();
            using var dbContext = CreateObjectParserContext(connection);
            var manager = new ReportTextManager(dbContext, null, obsRepoMock.Object, null, null, null, new ObjectsRepo(dbContext));
            var session = new ObsSession { Id = 5, UserId = 1, ReportText = "A faint patch.\r\nIt was >New patch<." };

            var observation = manager.Parse(session).Values.Single();

            Assert.That(observation.DsoObservations.Single().UserObjectId, Is.EqualTo(dbContext.UserObjects.Single().Id));
            Assert.That(session.ReportText, Does.Contain("It was New patch."));
        }

        /// <summary>
        /// Allows privileged shared creation and rejects unprivileged shared creation.
        /// </summary>
        [Test]
        public void InlineGlobalObjectRequiresPermission()
        {
            using var connection = new SqliteConnection("Filename=:memory:");
            connection.Open();
            using var dbContext = CreateObjectParserContext(connection);
            var manager = new ReportTextManager(dbContext, null, obsRepoMock.Object, null, null, null, new ObjectsRepo(dbContext));
            var denied = new ObsSession { Id = 5, UserId = 1, ReportText = ">>Shared target<< observed." };

            Assert.Throws<ObsToolException>(() => manager.Parse(denied));
            Assert.That(dbContext.OtherObjects, Is.Empty);

            var allowed = new ObsSession { Id = 6, UserId = 1, ReportText = ">>Shared target<< observed." };
            var observation = manager.Parse(allowed, true).Values.Single();
            var created = dbContext.OtherObjects.Single();
            Assert.That(observation.DsoObservations.Single().OtherObjectId, Is.EqualTo(created.Id));
            Assert.That(allowed.ReportText, Does.Not.Contain(">"));
        }

        /// <summary>
        /// Reuses a stored custom object for either marker spelling without creating a duplicate.
        /// </summary>
        [TestCase(">Existing target<")]
        [TestCase(">>Existing target<<")]
        public void InlineObjectReusesExistingName(string markedName)
        {
            using var connection = new SqliteConnection("Filename=:memory:");
            connection.Open();
            using var dbContext = CreateObjectParserContext(connection);
            dbContext.UserObjects.Add(new UserObject { Id = 20, UserId = 1, Name = "Existing target" });
            dbContext.SaveChanges();
            var manager = new ReportTextManager(dbContext, null, obsRepoMock.Object, null, null, null, new ObjectsRepo(dbContext));
            var session = new ObsSession { Id = 5, UserId = 1, ReportText = markedName + " observed." };

            var observation = manager.Parse(session).Values.Single();

            Assert.That(dbContext.UserObjects.Count(), Is.EqualTo(1));
            Assert.That(dbContext.OtherObjects, Is.Empty);
            Assert.That(observation.DsoObservations.Single().UserObjectId, Is.EqualTo(20));
            Assert.That(session.ReportText, Does.Not.Contain(">"));
        }

        /// <summary>
        /// Lets any user reference an existing shared object with global markers.
        /// </summary>
        [Test]
        public void InlineGlobalMarkerReusesSharedObjectWithoutCreationPrivilege()
        {
            using var connection = new SqliteConnection("Filename=:memory:");
            connection.Open();
            using var dbContext = CreateObjectParserContext(connection);
            dbContext.OtherObjects.Add(new OtherObject { Id = 10, Name = "Shared target" });
            dbContext.SaveChanges();
            var manager = new ReportTextManager(dbContext, null, obsRepoMock.Object, null, null, null, new ObjectsRepo(dbContext));
            var session = new ObsSession { Id = 5, UserId = 1, ReportText = ">>Shared target<< observed." };

            var observation = manager.Parse(session).Values.Single();

            Assert.That(dbContext.OtherObjects.Count(), Is.EqualTo(1));
            Assert.That(observation.DsoObservations.Single().OtherObjectId, Is.EqualTo(10));
            Assert.That(session.ReportText, Does.Not.Contain(">"));
        }

        /// <summary>
        /// Applies the object editor's name validation to marked names.
        /// </summary>
        [Test]
        public void InlineObjectRejectsInvalidName()
        {
            using var connection = new SqliteConnection("Filename=:memory:");
            connection.Open();
            using var dbContext = CreateObjectParserContext(connection);
            var manager = new ReportTextManager(dbContext, null, obsRepoMock.Object, null, null, null, new ObjectsRepo(dbContext));
            var session = new ObsSession { Id = 5, UserId = 1, ReportText = ">Bad#name< observed." };

            Assert.Throws<ObsToolException>(() => manager.Parse(session));
            Assert.That(dbContext.UserObjects, Is.Empty);
        }

        /// <summary>
        /// Creates an isolated object database for report parser tests.
        /// </summary>
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

        /// <summary>
        /// Verifies that an attached section marker preserves every object and marks the whole group as not detected.
        /// </summary>
        [TestCase("NGC 123!!", new[] { "NGC 123" })]
        [TestCase("NGC 123 !!", new[] { "NGC 123" })]
        [TestCase("NGC 123 blaha!!", new[] { "NGC 123" })]
        [TestCase("Test M31 and M33!!", new[] { "M 31", "M 33" })]
        [TestCase("Test M31 and M33!!.", new[] { "M 31", "M 33" })]
        [TestCase("M31!! and M33", new[] { "M 31", "M 33" })]
        public void testSectionNonDetectionMarkerImmediatelyAfterObject(string reportText, string[] expectedNames)
        {
            var reportTextManager = new ReportTextManager(null, null, obsRepoMock.Object, null, null);
            var obsSession = new ObsSession
            {
                Id = 5,
                Date = DateTime.Now,
                ReportText = reportText,
            };

            var observationsMap = reportTextManager.Parse(obsSession);

            Assert.That(observationsMap.Count, Is.EqualTo(1));
            var observation = observationsMap.GetAt(0).Value;
            Assert.That(observation.DsoObservations.Select(dsoObs => dsoObs.Dso.Name), Is.EqualTo(expectedNames));
            Assert.That(observation.NonDetection, Is.True);
            Assert.That(observation.DsoObservations.All(dsoObs => dsoObs.NonDetection), Is.True);
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
