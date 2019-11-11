using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ObsTool
{
    public class AutoMapperProfile : AutoMapper.Profile
    {
        public AutoMapperProfile()
        {
            //CreateMap<Department, DepartmentDTO>().ReverseMap();
            // disabling because the full ObsSession object gives a recursive problem when asking for a dso's observations
            CreateMap<Entities.DsoObservation, Models.DsoObservationDto>();
            CreateMap<Entities.ObsSession, Models.ObsSessionDto>();
            CreateMap<Entities.ObsSession, Models.ObsSessionDtoSimple>();
            CreateMap<Models.ObsSessionDto, Entities.ObsSession>();
            CreateMap<Models.ObsSessionDtoForUpdate, Entities.ObsSession>();
            CreateMap<Models.ObsSessionDtoForCreation, Entities.ObsSession>();
            CreateMap<Entities.Location, Models.LocationDto>();
            CreateMap<Models.LocationDto, Entities.Location>();
            CreateMap<Models.LocationDtoForCreation, Entities.Location>();
            CreateMap<Models.LocationDtoForUpdate, Entities.Location>();
            CreateMap<Entities.Dso, Models.DsoDto>();
            CreateMap<Entities.Observation, Models.ObservationDto>();
            CreateMap<Models.ObservationDto, Entities.Observation>();
            CreateMap<Entities.ObsResource, Models.ObsResourceDto>();
            CreateMap<Models.ObsResourceDto, Entities.ObsResource>();
            CreateMap<Models.ObsResourceDtoForCreationAndUpdate, Entities.ObsResource>();
            CreateMap<Entities.DsoExtra, Models.DsoExtraDto>();
            CreateMap<Models.DsoExtraDto, Entities.DsoExtra>();
        }
    }
}
