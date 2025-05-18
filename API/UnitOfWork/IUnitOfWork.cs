using API.Repositories.Interfaces;

namespace API.UnitOfWork;

public interface IUnitOfWork
{
    ICategoryRepository CategoryRepository { get; }
    ISoftwareDevArtifactRepository SoftwareDevArtifactRepository { get; }
    IUserRepository UserRepository { get; }
    IDownloadRepository DownloadRepository { get; }
    IFeedbackRepository FeedbackRepository { get; }
    
    void Save();
    void ClearChangeTracker(); // Added for refreshing the EF Core ChangeTracker
}