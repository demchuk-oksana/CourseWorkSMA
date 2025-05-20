using API.Models;

namespace API.Services.Interfaces
{
    public interface IArtifactSearchService
    {
        IEnumerable<SoftwareDevArtifact> Search(string searchQuery);
        IEnumerable<SoftwareDevArtifact> FilterByProgrammingLanguage(string language);
        IEnumerable<SoftwareDevArtifact> FilterByFramework(string framework);
        IEnumerable<SoftwareDevArtifact> FilterByLicenseType(string licenseType);
        IEnumerable<SoftwareDevArtifact> FilterByCombinedCriteria(ArtifactSearchQuery query);
        int CountByCombinedCriteria(ArtifactSearchQuery query);
    }
}