using API.DatabaseContexts;
using API.Models;
using API.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace API.Repositories;

public class DownloadRepository : IDownloadRepository
{
    private readonly ArtifactsDbContext _context;

    public DownloadRepository(ArtifactsDbContext context)
    {
        _context = context;
    }

    public void LogDownload(DownloadHistory history)
    {
        _context.Downloads.Add(history);
    }

    public IEnumerable<DownloadHistory> GetUserHistory(int userId)
    {
        return _context.Downloads
            .Where(d => d.UserId == userId)
            .Include(d => d.Artifact)
            .Include(d => d.Version)
            .OrderByDescending(d => d.Timestamp)
            .ToList();
    }
}
