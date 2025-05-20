using API.DatabaseContexts;
using API.Models;
using API.Repositories;
using Microsoft.EntityFrameworkCore;
using Xunit;
using System;
using System.Collections.Generic;
using System.Linq;

namespace UnitTests
{
    public class CategoryRepositoryTests
    {
        private readonly DbContextOptions<ArtifactsDbContext> _options;
        private readonly ArtifactsDbContext _dbContext;
        private readonly CategoryRepository _repository;

        // Sample test data
        private readonly List<Category> _categories = new List<Category>
        {
            new Category { Id = 1, Name = "Root Category 1", ParentCategoryId = null, OrderIndex = 0 },
            new Category { Id = 2, Name = "Root Category 2", ParentCategoryId = null, OrderIndex = 1 },
            new Category { Id = 3, Name = "Subcategory 1.1", ParentCategoryId = 1, OrderIndex = 0 },
            new Category { Id = 4, Name = "Subcategory 1.2", ParentCategoryId = 1, OrderIndex = 1 },
            new Category { Id = 5, Name = "Subcategory 2.1", ParentCategoryId = 2, OrderIndex = 0 }
        };

        private readonly List<UserCategoryPreference> _preferences = new List<UserCategoryPreference>
        {
            new UserCategoryPreference { Id = 1, CategoryId = 1, UserId = 1, IsExpanded = true },
            new UserCategoryPreference { Id = 2, CategoryId = 2, UserId = 1, IsExpanded = false }
        };

        public CategoryRepositoryTests()
        {
            // Setup in-memory database for testing
            _options = new DbContextOptionsBuilder<ArtifactsDbContext>()
                .UseInMemoryDatabase(databaseName: $"CategoryRepositoryTestDb_{Guid.NewGuid()}")
                .Options;

            _dbContext = new ArtifactsDbContext(_options);
            SeedDatabase();

            _repository = new CategoryRepository(_dbContext);
        }

        private void SeedDatabase()
        {
            // Clear existing data
            _dbContext.Categories.RemoveRange(_dbContext.Categories);
            _dbContext.CategoryPreferences.RemoveRange(_dbContext.CategoryPreferences);
            _dbContext.SaveChanges();

            // Add test data
            _dbContext.Categories.AddRange(_categories);
            _dbContext.CategoryPreferences.AddRange(_preferences);
            _dbContext.SaveChanges();
        }

        [Fact]
        public void GetRootCategories_ShouldReturnOnlyRootCategories()
        {
            // Act
            var result = _repository.GetRootCategories();

            // Assert
            Assert.Equal(2, result.Count());
            foreach (var category in result)
            {
                Assert.Null(category.ParentCategoryId);
            }
            var resultList = result.ToList();
            Assert.Equal("Root Category 1", resultList[0].Name);
            Assert.Equal("Root Category 2", resultList[1].Name);
            Assert.True(result.First().OrderIndex < result.Last().OrderIndex);
        }

        [Fact]
        public void GetSubcategories_ShouldReturnCategoriesWithSpecifiedParent()
        {
            // Act
            var result = _repository.GetSubcategories(1);

            // Assert
            Assert.Equal(2, result.Count());
            foreach (var category in result)
            {
                Assert.Equal(1, category.ParentCategoryId);
            }
        }

        [Fact]
        public void Rearrange_ShouldUpdateParentAndOrderIndex()
        {
            // Arrange
            int categoryId = 3; // Subcategory 1.1
            int? newParentId = 2; // Root Category 2
            int newPosition = 0;

            // Act
            _repository.Rearrange(categoryId, newParentId, newPosition);
            _dbContext.SaveChanges();

            var movedCategory = _dbContext.Categories.Find(categoryId);
            var siblings = _dbContext.Categories.Where(c => c.ParentCategoryId == newParentId).OrderBy(c => c.OrderIndex).ToList();

            // Assert
            Assert.Equal(newParentId, movedCategory.ParentCategoryId);
            Assert.Equal(0, movedCategory.OrderIndex);
            Assert.Equal(2, siblings.Count);
            Assert.Equal(movedCategory.Id, siblings[0].Id);
            Assert.Equal(5, siblings[1].Id);
            Assert.Equal(1, siblings[1].OrderIndex);
        }

        [Fact]
        public void Rearrange_ShouldThrowException_WhenCategoryNotFound()
        {
            // Arrange
            int nonExistentCategoryId = 999;

            // Act & Assert
            var exception = Assert.Throws<Exception>(() => _repository.Rearrange(nonExistentCategoryId, null, 0));
            Assert.Equal("Category not found", exception.Message);
        }

        [Fact]
        public void IsCategoryEmpty_ShouldReturnTrue_WhenCategoryHasNoSubcategoriesOrArtifacts()
        {
            // Arrange
            var emptyCategoryId = 5; // Subcategory 2.1

            // Act
            var result = _repository.IsCategoryEmpty(emptyCategoryId);

            // Assert
            Assert.Equal(true, result);
        }

        [Fact]
        public void SetDisplayPreference_ShouldAddNewPreference_WhenPreferenceDoesNotExist()
        {
            // Arrange
            int categoryId = 3; // Subcategory 1.1
            int userId = 1;
            bool isExpanded = true;

            // Act
            _repository.SetDisplayPreference(categoryId, userId, isExpanded);
            _dbContext.SaveChanges();

            // Assert
            var preference = _dbContext.CategoryPreferences.FirstOrDefault(p => p.CategoryId == categoryId && p.UserId == userId);
            Assert.NotNull(preference);
            Assert.Equal(isExpanded, preference.IsExpanded);
        }

        [Fact]
        public void SetDisplayPreference_ShouldUpdateExistingPreference()
        {
            // Arrange
            int categoryId = 1; // Root Category 1 (has existing preference)
            int userId = 1;
            bool newValue = false; // Changing from true to false

            // Act
            _repository.SetDisplayPreference(categoryId, userId, newValue);
            _dbContext.SaveChanges();

            // Assert
            var preference = _dbContext.CategoryPreferences.FirstOrDefault(p => p.CategoryId == categoryId && p.UserId == userId);
            Assert.NotNull(preference);
            Assert.Equal(newValue, preference.IsExpanded);
        }

        // ---------- More tests below ----------

        [Fact]
        public void GetRootCategories_ShouldReturnEmpty_WhenNoCategoriesExist()
        {
            // Arrange
            _dbContext.Categories.RemoveRange(_dbContext.Categories);
            _dbContext.SaveChanges();

            // Act
            var result = _repository.GetRootCategories();

            // Assert
            Assert.Empty(result);
        }

        [Fact]
        public void GetSubcategories_ShouldReturnEmpty_WhenNoSubcategoriesExist()
        {
            // Act
            var result = _repository.GetSubcategories(999); // Non-existent parent

            // Assert
            Assert.Empty(result);
        }

        [Fact]
        public void IsCategoryEmpty_ShouldReturnFalse_WhenCategoryHasSubcategories()
        {
            // Arrange
            var parentCategoryId = 1; // Has subcategories

            // Act
            var result = _repository.IsCategoryEmpty(parentCategoryId);

            // Assert
            Assert.False(result);
        }

        [Fact]
        public void IsCategoryEmpty_ShouldReturnFalse_WhenCategoryHasArtifacts()
        {
            // Arrange
            int categoryId = 4;
            // Simulate artifact in category 4
            _dbContext.Artifacts.Add(new SoftwareDevArtifact
            {
                Id = 10,
                Title = "Test Artifact",
                CategoryId = categoryId,
                Author = "Test Author",
                Description = "Test Description",
                Framework = "Test Framework",
                LicenseType = "MIT",
                ProgrammingLanguage = "C#",
                Url = "http://test-artifact.com",
                Version = "1.0.0"
            });
            _dbContext.SaveChanges();


            // Act
            var result = _repository.IsCategoryEmpty(categoryId);

            // Assert
            Assert.False(result);
        }

        [Fact]
        public void SetDisplayPreference_ShouldNotDuplicatePreferences()
        {
            // Arrange
            int categoryId = 1;
            int userId = 1;

            // There is already a preference for this pair
            var initialCount = _dbContext.CategoryPreferences.Count();

            // Act
            _repository.SetDisplayPreference(categoryId, userId, false);
            _repository.SetDisplayPreference(categoryId, userId, true);
            _dbContext.SaveChanges();

            // Assert
            var finalCount = _dbContext.CategoryPreferences.Count();
            Assert.Equal(initialCount, finalCount);
        }

        [Fact]
        public void Rearrange_ShouldNotChangeOrderIndex_IfPositionIsTheSame()
        {
            // Arrange
            int categoryId = 3;
            int? newParentId = 1; // Same parent
            int currentOrderIndex = _dbContext.Categories.Find(categoryId).OrderIndex;

            // Act
            _repository.Rearrange(categoryId, newParentId, currentOrderIndex);
            _dbContext.SaveChanges();

            // Assert
            var category = _dbContext.Categories.Find(categoryId);
            Assert.Equal(currentOrderIndex, category.OrderIndex);
        }

        [Fact]
        public void SetDisplayPreference_ShouldUpdateForMultipleUsers()
        {
            // Arrange
            int categoryId = 1;
            int userId1 = 1;
            int userId2 = 2;
            bool pref1 = false;
            bool pref2 = true;

            // Act
            _repository.SetDisplayPreference(categoryId, userId1, pref1);
            _repository.SetDisplayPreference(categoryId, userId2, pref2);
            _dbContext.SaveChanges();

            // Assert
            var p1 = _dbContext.CategoryPreferences.FirstOrDefault(p => p.CategoryId == categoryId && p.UserId == userId1);
            var p2 = _dbContext.CategoryPreferences.FirstOrDefault(p => p.CategoryId == categoryId && p.UserId == userId2);

            Assert.NotNull(p1);
            Assert.NotNull(p2);
            Assert.Equal(pref1, p1.IsExpanded);
            Assert.Equal(pref2, p2.IsExpanded);
        }

       
    }
}