namespace API.DTOs;

public class CategoryReorderDto
{
    public int CategoryId { get; set; }
    public int? NewParentId { get; set; }
    public int NewPosition { get; set; }
}
