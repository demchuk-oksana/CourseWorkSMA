namespace API.DTOs;

using System.ComponentModel.DataAnnotations;

public class ArtifactVersionDto
{
    [Required]
    [RegularExpression(@"^\d+\.\d+(\.\d+)?$", ErrorMessage = "Invalid version format.")]
    public string VersionNumber { get; set; }

    [Required]
    public string Changes { get; set; }

    [Required]
    [Url]
    public string DownloadUrl { get; set; }
}
