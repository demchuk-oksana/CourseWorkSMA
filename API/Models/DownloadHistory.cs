namespace API.Models;

public class DownloadHistory
{
    public int Id { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    public int UserId { get; set; }
    public User User { get; set; }

    public int ArtifactId { get; set; }
    public SoftwareDevArtifact Artifact { get; set; }

    public int? VersionId { get; set; }
    public ArtifactVersion? Version { get; set; }
}
