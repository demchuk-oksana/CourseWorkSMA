using API.DTOs;
using API.Models;
using AutoMapper;

namespace API;

public class AutoMapperProfile : Profile
{
    public AutoMapperProfile()
    {
        CreateMap<Category, CategoryTreeDto>()
            .ForMember(dest => dest.Subcategories, opt => opt.MapFrom(src => src.Subcategories))
            .ForMember(dest => dest.IsExpanded, opt => opt.MapFrom(src => src.IsExpanded));
    }
}