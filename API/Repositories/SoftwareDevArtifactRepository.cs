using API.DatabaseContexts;
using API.Models;
using API.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace API.Repositories;

public class SoftwareDevArtifactRepository : Repository<SoftwareDevArtifact>, ISoftwareDevArtifactRepository
{
    private readonly ArtifactsDbContext _context;

    public SoftwareDevArtifactRepository(ArtifactsDbContext context) : base(context)
    {
        _context = context;
    }

    public new SoftwareDevArtifact GetById(int id)
    {
        return _context.Artifacts
            .Where(a => a.Id == id)
            .Include(a => a.Versions)
            .First();
    }

    public IEnumerable<SoftwareDevArtifact> GetByCategory(int categoryId)
    {
        return _context.Artifacts
            .Where(a => a.CategoryId == categoryId)
            .Include(a => a.Versions)
            .ToList();
    }

    public void AddVersion(int artifactId, ArtifactVersion version)
    {
        var artifact = _context.Artifacts
            .Include(a => a.Versions)
            .FirstOrDefault(a => a.Id == artifactId);

        if (artifact == null)
            throw new Exception("Artifact not found");

        artifact.AddVersion(version);
        _context.Artifacts.Update(artifact);
    }

    public IEnumerable<ArtifactVersion> GetVersionHistory(int artifactId)
    {
        return _context.ArtifactVersions
            .Where(v => v.SoftwareDevArtifactId == artifactId)
            .OrderByDescending(v => v.UploadDate)
            .ToList();
    }

    public IEnumerable<SoftwareDevArtifact> Search(string searchQuery)
    {
        return _context.Artifacts
            .Where(a =>
                a.Title.Contains(searchQuery) ||
                a.Description.Contains(searchQuery) ||
                a.Author.Contains(searchQuery)
            )
            .Include(a => a.Versions)
            .ToList();
    }

    public IEnumerable<SoftwareDevArtifact> FilterByProgrammingLanguage(string language)
    {
        return _context.Artifacts
            .Where(a => a.ProgrammingLanguage == language)
            .Include(a => a.Versions)
            .ToList();
    }

    public IEnumerable<SoftwareDevArtifact> FilterByFramework(string framework)
    {
        return _context.Artifacts
            .Where(a => a.Framework == framework)
            .Include(a => a.Versions)
            .ToList();
    }

    public IEnumerable<SoftwareDevArtifact> FilterByLicenseType(string licenseType)
    {
        return _context.Artifacts
            .Where(a => a.LicenseType == licenseType)
            .Include(a => a.Versions)
            .ToList();
    }

    public IEnumerable<SoftwareDevArtifact> FilterByCombinedCriteria(ArtifactSearchQuery query)
    {
        var artifacts = _context.Artifacts.AsQueryable();

        if (!string.IsNullOrEmpty(query.SearchTerm))
        {
            string term = query.SearchTerm.ToLower();

            artifacts = artifacts.Where(a =>
                a.Title.ToLower().Contains(term) ||
                a.Description.ToLower().Contains(term) ||
                a.Author.ToLower().Contains(term) ||
                a.ProgrammingLanguage.ToLower().Contains(term) ||
                a.Framework.ToLower().Contains(term) ||
                a.LicenseType.ToLower().Contains(term) ||
                a.Version.ToLower().Contains(term)
            );
        }

        if (!string.IsNullOrEmpty(query.ProgrammingLanguage))
        {
            artifacts = artifacts.Where(a => a.ProgrammingLanguage == query.ProgrammingLanguage);
        }

        if (!string.IsNullOrEmpty(query.Framework))
        {
            artifacts = artifacts.Where(a => a.Framework == query.Framework);
        }

        if (!string.IsNullOrEmpty(query.LicenseType))
        {
            artifacts = artifacts.Where(a => a.LicenseType == query.LicenseType);
        }

        if (query.CategoryId.HasValue)
        {
            artifacts = artifacts.Where(a => a.CategoryId == query.CategoryId.Value);
        }

        // Sorting
        artifacts = query.SortBy switch
        {
            "Title" => query.SortDescending ? artifacts.OrderByDescending(a => a.Title) : artifacts.OrderBy(a => a.Title),
            "Author" => query.SortDescending ? artifacts.OrderByDescending(a => a.Author) : artifacts.OrderBy(a => a.Author),
            _ => query.SortDescending ? artifacts.OrderByDescending(a => a.Created) : artifacts.OrderBy(a => a.Created)
        };

        // Paging
        artifacts = artifacts
            .Skip((query.PageNumber - 1) * query.PageSize)
            .Take(query.PageSize);

        return artifacts
            .Include(a => a.Versions)
            .ToList();
    }
}
