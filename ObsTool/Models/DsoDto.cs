using ObsTool.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ObsTool.Models
{
    public class DsoDto
    {
        private string _otherCommonNames;

        public int Id { get; set; }
        public string ObjectKind { get; set; } = ObservedObjectKind.Sac;
        public string ObjectKey { get; set; }
        public string Catalog { get; set; }
        public string CatalogNumber { get; set; }
        public string Name { get; set; }
        public string OtherNames { get; set; }
        public string CommonName { get; set; }
        public string AllCommonNames { get; set; }
        public string OtherCommonNames {
            get
            {
                if (!string.IsNullOrWhiteSpace(AllCommonNames) && !string.IsNullOrWhiteSpace(CommonName) && AllCommonNames.Contains(CommonName))
                {
                    this._otherCommonNames = AllCommonNames
                        .Replace(", " + CommonName, "")
                        .Replace(CommonName + ", ", "")
                        .Replace(CommonName, "");
                }
                return this._otherCommonNames;
            }
            set
            {
                _otherCommonNames = value;
            }
        }
        public string Type { get; set; }
        public string Con { get; set; }
        public string RA { get; set; }
        public string DEC { get; set; }
        public string Mag { get; set; }
        public string SB { get; set; }
        public int U2K { get; set; }
        public int TI { get; set; }
        public string SizeMax { get; set; }
        public string SizeMin { get; set; }
        public string PA { get; set; }
        public string Class { get; set; }
        public string NSTS { get; set; }
        public string BRSTR { get; set; }
        public string BCHM { get; set; }
        public string DreyerDesc { get; set; }
        public string Notes { get; set; }
        public DsoExtraDto DsoExtra { get; set; }
        public int NumObservations { get; set; }
        public ObservationDto[] Observations { get; set; }
        public HerschelInfoDto[] HerschelObjects { get; set; }

        /// <summary>
        /// Projects a SAC entity into the common object DTO used by object cards.
        /// </summary>
        public static DsoDto FromDso(ObsTool.Entities.Dso dso)
        {
            if (dso == null)
            {
                return null;
            }

            return new DsoDto
            {
                Id = dso.Id,
                ObjectKind = ObservedObjectKind.Sac,
                ObjectKey = $"{ObservedObjectKind.Sac}:{dso.Id}",
                Catalog = dso.Catalog,
                CatalogNumber = dso.CatalogNumber,
                Name = dso.Name,
                OtherNames = dso.OtherNames,
                CommonName = dso.CommonName,
                AllCommonNames = dso.AllCommonNames,
                Type = dso.Type,
                Con = dso.Con,
                RA = dso.RA,
                DEC = dso.DEC,
                Mag = dso.Mag,
                SB = dso.SB,
                U2K = dso.U2K,
                TI = dso.TI,
                SizeMax = dso.SizeMax,
                SizeMin = dso.SizeMin,
                PA = dso.PA,
                Class = dso.Class,
                NSTS = dso.NSTS,
                BRSTR = dso.BRSTR,
                BCHM = dso.BCHM,
                DreyerDesc = dso.DreyerDesc,
                Notes = dso.Notes,
                DsoExtra = dso.DsoExtra == null
                    ? null
                    : new DsoExtraDto
                    {
                        Id = dso.DsoExtra.Id,
                        Rating = dso.DsoExtra.Rating,
                        FollowUp = dso.DsoExtra.FollowUp
                    }
            };
        }

        /// <summary>
        /// Projects a shared non-SAC object into the common card DTO shape.
        /// </summary>
        public static DsoDto FromOtherObject(ObsTool.Entities.OtherObject otherObject)
        {
            if (otherObject == null)
            {
                return null;
            }

            return new DsoDto
            {
                Id = otherObject.Id,
                ObjectKind = ObservedObjectKind.Other,
                ObjectKey = $"{ObservedObjectKind.Other}:{otherObject.Id}",
                Catalog = "",
                CatalogNumber = "",
                Name = otherObject.Name,
                OtherNames = otherObject.OtherNames,
                CommonName = otherObject.CommonName,
                AllCommonNames = otherObject.AllCommonNames,
                Type = otherObject.Type,
                Con = otherObject.Const,
                RA = otherObject.RA,
                DEC = otherObject.DEC,
                Mag = otherObject.Mag,
                Notes = otherObject.Notes
            };
        }

        /// <summary>
        /// Projects a user-owned object into the common card DTO shape.
        /// </summary>
        public static DsoDto FromUserObject(ObsTool.Entities.UserObject userObject)
        {
            if (userObject == null)
            {
                return null;
            }

            return new DsoDto
            {
                Id = userObject.Id,
                ObjectKind = ObservedObjectKind.User,
                ObjectKey = $"{ObservedObjectKind.User}:{userObject.Id}",
                Catalog = "",
                CatalogNumber = "",
                Name = userObject.Name,
                OtherNames = userObject.OtherNames,
                CommonName = userObject.CommonName,
                AllCommonNames = userObject.AllCommonNames,
                Type = userObject.Type,
                Con = userObject.Const,
                RA = userObject.RA,
                DEC = userObject.DEC,
                Mag = userObject.Mag,
                Notes = userObject.Notes
            };
        }
    }
}
