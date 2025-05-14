namespace API.Models;

public class ArtifactSearchQuery
{
    public string? SearchTerm { get; set; }

    public string? ProgrammingLanguage { get; set; }
    public string? Framework { get; set; }
    public string? LicenseType { get; set; }

    public int? CategoryId { get; set; }

    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;

    public string? SortBy { get; set; } = "Created";
    public bool SortDescending { get; set; } = true;
}
