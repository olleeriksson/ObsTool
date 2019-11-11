using ObsTool.Controllers;
using NUnit.Framework;
using System;
using ObsTool.Entities;
using ObsTool.Utils;
using ObsTool.Services;
using System.Collections.Generic;
using Moq;

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
            obsRepoMock = new Mock<IDsoRepo>();
            obsRepoMock.CallBase = true;
            obsRepoMock.Setup(x => x.GetAllCatalogs()).Returns(new List<string> { "M", "Tr", "LND", "NGC", "IC", "Sh", "UGC", "PGC", "Cr", "B", "Pal" });
            obsRepoMock.Setup(x => x.GetDsoByName(It.IsAny<string>(), false)).Returns(() => new Dso { Id = generatedDsoId++ });
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
            Assert.AreEqual(2, observationsMap.Count);
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
            Assert.AreEqual(2, observationsMap.Count);
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

            Assert.AreEqual(16, observationsMap.Count);
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
            Assert.AreEqual(7, observationsMap.Count);
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
            Assert.AreEqual(3, observationsMap.Count);
        }
    }
}
