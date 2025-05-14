using API.Models;

namespace API.Repositories.Interfaces;

public interface IFeedbackRepository
{
    void SubmitFeedback(ArtifactFeedback feedback);
    ArtifactFeedback? GetUserFeedback(int userId, int artifactId);
    IEnumerable<ArtifactFeedback> GetFeedbacks(int artifactId);
}
