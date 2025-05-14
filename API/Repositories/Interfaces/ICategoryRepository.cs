using API.Models;

namespace API.Repositories.Interfaces;

public interface ICategoryRepository : IRepository<Category>
{
    IEnumerable<Category> GetRootCategories();
    IEnumerable<Category> GetSubcategories(int parentId);
    void Rearrange(int categoryId, int? newParentId, int newPosition = 0);
    bool IsCategoryEmpty(int categoryId);
    void SetDisplayPreference(int categoryId, int userId, bool isExpanded);
    bool? GetDisplayPreference(int categoryId, int userId);
}
