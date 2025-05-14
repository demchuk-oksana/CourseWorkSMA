using API.Models;

namespace API.Repositories.Interfaces;

public interface ISoftwareDevArtifactRepository : IRepository<SoftwareDevArtifact>
{
    IEnumerable<SoftwareDevArtifact> GetByCategory(int categoryId);
    void AddVersion(int artifactId, ArtifactVersion version);
    IEnumerable<ArtifactVersion> GetVersionHistory(int artifactId);
    IEnumerable<SoftwareDevArtifact> Search(string searchQuery);
    IEnumerable<SoftwareDevArtifact> FilterByProgrammingLanguage(string language);
    IEnumerable<SoftwareDevArtifact> FilterByFramework(string framework);
    IEnumerable<SoftwareDevArtifact> FilterByLicenseType(string licenseType);
    IEnumerable<SoftwareDevArtifact> FilterByCombinedCriteria(ArtifactSearchQuery query);
}
