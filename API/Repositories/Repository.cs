using API.DatabaseContexts;
using API.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace API.Repositories;

public class Repository<T> : IRepository<T> where T : class
{
    protected readonly ArtifactsDbContext _context;
    protected readonly DbSet<T> _dbSet;

    public Repository(ArtifactsDbContext context)
    {
        _context = context;
        _dbSet = context.Set<T>();
    }

    public IEnumerable<T> GetAll() => _dbSet.ToList();
    public T? GetById(int id) => _dbSet.Find(id);
    public void Add(T entity) => _dbSet.Add(entity);
    public void Update(T entity) => _dbSet.Update(entity);
    public void Delete(int id)
    {
        var entity = _dbSet.Find(id);
        if (entity != null) _dbSet.Remove(entity);
    }
    public IEnumerable<T> Find(Func<T, bool> predicate) => _dbSet.Where(predicate);
}
