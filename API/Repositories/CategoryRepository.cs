using API.DatabaseContexts;
using API.Models;
using API.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace API.Repositories;

public class CategoryRepository : Repository<Category>, ICategoryRepository
{
    private readonly ArtifactsDbContext _context;

    public CategoryRepository(ArtifactsDbContext context) : base(context)
    {
        _context = context;
    }

    public IEnumerable<Category> GetRootCategories()
    {
        return _context.Categories
            .Where(c => c.ParentCategoryId == null)
            .Include(c => c.Subcategories)
            .OrderBy(c => c.OrderIndex)
            .ToList();

    }

    public IEnumerable<Category> GetSubcategories(int parentId)
    {
        return _context.Categories
            .Where(c => c.ParentCategoryId == parentId)
            .Include(c => c.Subcategories)
            .ToList();
    }

    public void Rearrange(int categoryId, int? newParentId, int newPosition = 0)
    {
        var category = _context.Categories.FirstOrDefault(c => c.Id == categoryId);
        if (category == null) throw new Exception("Category not found");

        if (category.ParentCategoryId != newParentId)
        {
            category.ParentCategoryId = newParentId;
        }

        // Reorder siblings under new parent
        var siblings = _context.Categories
            .Where(c => c.ParentCategoryId == newParentId && c.Id != categoryId)
            .OrderBy(c => c.OrderIndex)
            .ToList();

        siblings.Insert(newPosition, category);

        for (int i = 0; i < siblings.Count; i++)
        {
            siblings[i].OrderIndex = i;
            _context.Categories.Update(siblings[i]);
        }
    }

    public bool IsCategoryEmpty(int categoryId)
    {
        var category = _context.Categories
            .Include(c => c.Subcategories)
            .Include(c => c.Artifacts)
            .FirstOrDefault(c => c.Id == categoryId);

        return category != null && category.IsEmpty();
    }

    public void SetDisplayPreference(int categoryId, int userId, bool isExpanded)
    {
        var pref = _context.CategoryPreferences
            .FirstOrDefault(p => p.CategoryId == categoryId && p.UserId == userId);

        if (pref != null)
        {
            pref.IsExpanded = isExpanded;
        }
        else
        {
            _context.CategoryPreferences.Add(new UserCategoryPreference
            {
                CategoryId = categoryId,
                UserId = userId,
                IsExpanded = isExpanded
            });
        }
    }

    public bool? GetDisplayPreference(int categoryId, int userId)
    {
        var pref = _context.CategoryPreferences
            .FirstOrDefault(p => p.CategoryId == categoryId && p.UserId == userId);

        return pref?.IsExpanded;
    }

}
