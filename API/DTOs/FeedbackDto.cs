namespace API.DTOs;

public class FeedbackDto
{
    public int ArtifactId { get; set; }
    public int Rating { get; set; } // 1 to 5
    public string Comment { get; set; }
}
