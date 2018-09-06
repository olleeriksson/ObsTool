using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ObsTool.Entities
{
    public static class MainDbContextExtensions
    {
        public static void SeedDatabase(this MainDbContext context)
        {
            var location1 = new Location() { Name = "Snogeholms strövområder", GoogleMapsAddress = "Gydarpsvägen, Sjöbo" };
            var location2 = new Location() { Name = "Balkongen i Malmö", GoogleMapsAddress = "Spångatan 32B, Malmö" };
            if (!context.Locations.Any())
            {
                var locations = new Location[] { location1, location2 };
                context.Locations.AddRange(locations);
            }

            if (!context.ObsSessions.Any())
            {
                var sessions = new ObsSession[]
                {
                    new ObsSession() { Date = new DateTime(2017, 12, 18), Location = location1, Title = "Coldest night of the year" },
                    new ObsSession { Date = new DateTime(2018, 06, 20), Location = location2, Title = "First time observing from the balcony" }
                };
                context.ObsSessions.AddRange(sessions);
            }

            if (!context.Constellations.Any())
            {
                var constellations = new Constellation[] {
                    new Constellation ("Andromeda", "And"),
                    new Constellation ("Antlia", "Ant"),
                    new Constellation ("Apus", "Aps"),
                    new Constellation ("Aquarius", "Aqr"),
                    new Constellation ("Aquila", "Aql"),
                    new Constellation ("Ara", "Ara"),
                    new Constellation ("Aries", "Ari"),
                    new Constellation ("Auriga", "Aur"),
                    new Constellation ("Bootes", "Boo"),
                    new Constellation ("Caelum", "Cae"),
                    new Constellation ("Camelopardalis", "Cam"),
                    new Constellation ("Cancer", "Cnc"),
                    new Constellation ("Canes Venatici", "Cvn"),
                    new Constellation ("Canis Major", "Cma"),
                    new Constellation ("Canis Minor", "Cmi"),
                    new Constellation ("Capricornus", "Cap"),
                    new Constellation ("Carina", "Car"),
                    new Constellation ("Cassiopeia", "Cas"),
                    new Constellation ("Centaurus", "Cen"),
                    new Constellation ("Cepheus", "Cep"),
                    new Constellation ("Cetus", "Cet"),
                    new Constellation ("Chamaeleon", "Cha"),
                    new Constellation ("Circinus", "Cir"),
                    new Constellation ("Columba", "Col"),
                    new Constellation ("Coma Berenices", "Com"),
                    new Constellation ("Corona Australis","Cra"),
                    new Constellation ("Corona Borealis", "Crb"),
                    new Constellation ("Corvus", "Crv"),
                    new Constellation ("Crater", "Crt"),
                    new Constellation ("Crux", "Cru"),
                    new Constellation ("Cygnus", "Cyg"),
                    new Constellation ("Delphinus", "Del"),
                    new Constellation ("Dorado", "Dor"),
                    new Constellation ("Draco", "Dra"),
                    new Constellation ("Equuleus", "Equ"),
                    new Constellation ("Eridanus", "Eri"),
                    new Constellation ("Fornax", "For"),
                    new Constellation ("Gemini", "Gem"),
                    new Constellation ("Grus", "Gru"),
                    new Constellation ("Hercules", "Her"),
                    new Constellation ("Horologium", "Hor"),
                    new Constellation ("Hydra", "Hya"),
                    new Constellation ("Hydrus", "Hyi"),
                    new Constellation ("Indus", "Ind"),
                    new Constellation ("Lacerta", "Lac"),
                    new Constellation ("Leo", "Leo"),
                    new Constellation ("Leo Minor", "LMi"),
                    new Constellation ("Lepus", "Lep"),
                    new Constellation ("Libra", "Lib"),
                    new Constellation ("Lupus", "Lup"),
                    new Constellation ("Lynx", "Lyn"),
                    new Constellation ("Lyra", "Lyr"),
                    new Constellation ("Mensa", "Men"),
                    new Constellation ("Microscopium", "Mic"),
                    new Constellation ("Monoceros", "Mon"),
                    new Constellation ("Musca", "Mus"),
                    new Constellation ("Norma", "Nor"),
                    new Constellation ("Octans", "Oct"),
                    new Constellation ("Ophiuchus", "Oph"),
                    new Constellation ("Orion", "Ori"),
                    new Constellation ("Pavo", "Pav"),
                    new Constellation ("Pegasus","Peg"),
                    new Constellation ("Perseus","Per"),
                    new Constellation ("Phoenix", "Phe"),
                    new Constellation ("Pictor", "Pic"),
                    new Constellation ("Pisces", "psc"),
                    new Constellation ("Pisces Austrinus", "PsA"),
                    new Constellation ("Puppis", "Pup"),
                    new Constellation ("Pyxis", "Pyx"),
                    new Constellation ("Reticulum", "Ret"),
                    new Constellation ("Sagitta", "Sge"),
                    new Constellation ("Sagittarius", "Sgr"),
                    new Constellation ("Scorpius", "Sco"),
                    new Constellation ("Sculptor", "Scl"),
                    new Constellation ("Scutum", "Sct"),
                    new Constellation ("Serpens", "Ser"),
                    new Constellation ("Sextans", "Sex"),
                    new Constellation ("Taurus", "Tau"),
                    new Constellation ("Telescopium", "Tel"),
                    new Constellation ("Triangulum Australe", "TrA"),
                    new Constellation ("Triangulum", "Tri"),
                    new Constellation ("Tucana", "Tuc"),
                    new Constellation ("Ursa Major", "UMa"),
                    new Constellation ("Ursa Minor", "UMi"),
                    new Constellation ("Vela", "Vel"),
                    new Constellation ("Virgo", "Vir"),
                    new Constellation ("Volans", "Vol"),
                    new Constellation ("Vulpecula", "Vul")
                };

                context.Constellations.AddRange(constellations);
            }
            context.SaveChanges();
        }
    }
}