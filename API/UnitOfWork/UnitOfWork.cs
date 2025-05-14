using API.DatabaseContexts;
using API.Repositories;
using API.Repositories.Interfaces;

namespace API.UnitOfWork;

public class UnitOfWork : IUnitOfWork, IDisposable
{
    private readonly ArtifactsDbContext _context;
    public ICategoryRepository CategoryRepository { get; private set; }
    public ISoftwareDevArtifactRepository SoftwareDevArtifactRepository { get; private set; }
    public IUserRepository UserRepository { get; private set; }
    public IDownloadRepository DownloadRepository { get; private set; }
    public IFeedbackRepository FeedbackRepository { get; private set; }

    public UnitOfWork(ArtifactsDbContext context)
    {
        _context = context;
        CategoryRepository = new CategoryRepository(context);
        SoftwareDevArtifactRepository = new SoftwareDevArtifactRepository(context);
        UserRepository = new UserRepository(context);
        DownloadRepository = new DownloadRepository(context);
        FeedbackRepository = new FeedbackRepository(context);
    }

    public void Save() => _context.SaveChanges();
    public void Dispose() => _context.Dispose();
}
