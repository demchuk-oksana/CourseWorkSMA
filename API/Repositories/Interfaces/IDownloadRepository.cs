using API.Models;

namespace API.Repositories.Interfaces;

public interface IDownloadRepository
{
    void LogDownload(DownloadHistory history);
    IEnumerable<DownloadHistory> GetUserHistory(int userId);
}
