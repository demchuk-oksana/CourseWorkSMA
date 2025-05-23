﻿using API.DatabaseContexts;
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

    public void ChangeNestingLevel(int categoryId, int? newParentId)
    {
        var category = _context.Categories.FirstOrDefault(c => c.Id == categoryId);
        if (category == null) throw new Exception("Category not found");

        category.ParentCategoryId = newParentId;
        _context.Categories.Update(category);
        _context.SaveChanges();
    }

    public IEnumerable<Category> GetRootCategories()
    {
        var allCategories = _context.Categories
            .AsNoTracking()
            .ToList();

        var categoryDict = allCategories.ToDictionary(c => c.Id);

        foreach (var category in allCategories)
        {
            category.Subcategories = new List<Category>();
        }

        foreach (var category in allCategories)
        {
            if (category.ParentCategoryId.HasValue && categoryDict.TryGetValue(category.ParentCategoryId.Value, out var parent))
            {
                parent.Subcategories.Add(category);
            }
        }

        return allCategories.Where(c => c.ParentCategoryId == null).ToList();
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

        _context.SaveChanges();
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
        Console.WriteLine($"Saving preference: userId={userId}, categoryId={categoryId}, isExpanded={isExpanded}");
        _context.SaveChanges();
    }

    // Returns a dictionary of categoryId -> isExpanded for the user
    public Dictionary<int, bool> GetDisplayPreference(int userId)
    {
        return _context.CategoryPreferences
            .Where(p => p.UserId == userId)
            .ToDictionary(p => p.CategoryId, p => p.IsExpanded);
    }
}