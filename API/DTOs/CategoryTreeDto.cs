namespace API.DTOs;

public class CategoryTreeDto
{
    public int Id { get; set; }
    public string Name { get; set; }
    public int? ParentCategoryId { get; set; }
    public List<CategoryTreeDto> Subcategories { get; set; } = new();
    public bool IsExpanded { get; set; } // NEW - Expansion state for UI
}