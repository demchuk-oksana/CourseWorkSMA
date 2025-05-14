namespace API.Models;

public class ArtifactFeedback
{
    public int Id { get; set; }
    public int Rating { get; set; } // 1-5
    public string Comment { get; set; }

    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    public int UserId { get; set; }
    public User User { get; set; }

    public int ArtifactId { get; set; }
    public SoftwareDevArtifact Artifact { get; set; }
}
