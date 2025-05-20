using API.Models;
using API.Repositories.Interfaces;
using API.Services.Interfaces;
using System.Collections.Generic;

namespace API.Services
{
    public class ArtifactSearchService : IArtifactSearchService
    {
        private readonly ISoftwareDevArtifactRepository _artifactRepository;

        public ArtifactSearchService(ISoftwareDevArtifactRepository artifactRepository)
        {
            _artifactRepository = artifactRepository;
        }

        public IEnumerable<SoftwareDevArtifact> Search(string searchQuery)
        {
            return _artifactRepository.Search(searchQuery);
        }

        public IEnumerable<SoftwareDevArtifact> FilterByProgrammingLanguage(string language)
        {
            return _artifactRepository.FilterByProgrammingLanguage(language);
        }

        public IEnumerable<SoftwareDevArtifact> FilterByFramework(string framework)
        {
            return _artifactRepository.FilterByFramework(framework);
        }

        public IEnumerable<SoftwareDevArtifact> FilterByLicenseType(string licenseType)
        {
            return _artifactRepository.FilterByLicenseType(licenseType);
        }

        public IEnumerable<SoftwareDevArtifact> FilterByCombinedCriteria(ArtifactSearchQuery query)
        {
            return _artifactRepository.FilterByCombinedCriteria(query);
        }

        public int CountByCombinedCriteria(ArtifactSearchQuery query)
        {
            return _artifactRepository.CountByCombinedCriteria(query);
        }
    }
}