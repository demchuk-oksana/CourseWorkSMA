using API.Models;

namespace API.DTOs;

using System.ComponentModel.DataAnnotations;

public class ArtifactCreateDto
{
    [Required]
    [MinLength(3)]
    public string Title { get; set; }

    [Required]
    [MinLength(10)]
    public string Description { get; set; }

    [Required]
    [Url]
    public string Url { get; set; }

    [Required]
    public DocumentationType Type { get; set; }

    [Required]
    [RegularExpression(@"^\d+\.\d+(\.\d+)?$", ErrorMessage = "Invalid version format. Use semantic versioning (e.g. 1.0.0).")]
    public string Version { get; set; }

    [Required]
    [MinLength(2)]
    public string ProgrammingLanguage { get; set; }

    [Required]
    [MinLength(2)]
    public string Framework { get; set; }

    [Required]
    public string LicenseType { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "CategoryId must be a positive integer.")]
    public int CategoryId { get; set; }
}

