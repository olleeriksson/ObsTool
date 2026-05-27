using ObsTool.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ObsTool.Models
{
    public class DsoObservationDto
    {
        // Must be populated manually becayse Observation has been removed from the entity
        //public ObservationDto Observation { get; set; }

        public int Id { get; set; }
        public int ObservationId { get; set; }

        public DsoDto Dso { get; set; }

        public int? DsoId { get; set; }

        public int? OtherObjectId { get; set; }

        public int? UserObjectId { get; set; }

        public string ObjectKind { get; set; }

        public string ObjectKey { get; set; }

        public int DisplayOrder { get; set; }

        public bool NonDetection { get; set; }

        /// <summary>
        /// Maps the polymorphic observation target into the common object DTO used by the client.
        /// </summary>
        public static DsoObservationDto FromEntity(ObsTool.Entities.DsoObservation dsoObservation)
        {
            var dto = new DsoObservationDto
            {
                Id = dsoObservation.Id,
                ObservationId = dsoObservation.ObservationId,
                DsoId = dsoObservation.DsoId,
                OtherObjectId = dsoObservation.OtherObjectId,
                UserObjectId = dsoObservation.UserObjectId,
                ObjectKind = ResolveObjectKind(dsoObservation),
                ObjectKey = dsoObservation.GetObjectKey(),
                DisplayOrder = dsoObservation.DisplayOrder,
                NonDetection = dsoObservation.NonDetection
            };

            dto.Dso = dto.ObjectKind == ObservedObjectKind.Sac
                ? DsoDto.FromDso(dsoObservation.Dso)
                : dto.ObjectKind == ObservedObjectKind.Other
                    ? DsoDto.FromOtherObject(dsoObservation.OtherObject)
                    : DsoDto.FromUserObject(dsoObservation.UserObject);

            return dto;
        }

        /// <summary>
        /// Resolves which nullable object foreign key is populated for the observation target.
        /// </summary>
        private static string ResolveObjectKind(ObsTool.Entities.DsoObservation dsoObservation)
        {
            if (dsoObservation.DsoId.HasValue)
            {
                return ObservedObjectKind.Sac;
            }

            if (dsoObservation.OtherObjectId.HasValue)
            {
                return ObservedObjectKind.Other;
            }

            return ObservedObjectKind.User;
        }
    }
}
