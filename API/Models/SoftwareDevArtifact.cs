namespace API.Models;

public class SoftwareDevArtifact
{
    public int Id { get; set; }
    public string Title { get; set; }
    public string Description { get; set; }
    public string Url { get; set; }
    public DocumentationType Type { get; set; }
    public DateTime Created { get; set; } = DateTime.UtcNow;
    public string Author { get; set; }
    public string Version { get; set; }
    public string ProgrammingLanguage { get; set; }
    public string Framework { get; set; }
    public string LicenseType { get; set; }

    public int CategoryId { get; set; }
    public Category Category { get; set; }

    public int UploaderId { get; set; }
    public User Uploader { get; set; }

    public List<ArtifactVersion> Versions { get; set; } = new();

    public void AddVersion(ArtifactVersion version) => Versions.Add(version);
    public List<ArtifactVersion> GetVersionHistory() => Versions.OrderByDescending(v => v.UploadDate).ToList();

    public List<ArtifactFeedback> Feedbacks { get; set; } = new();
}
