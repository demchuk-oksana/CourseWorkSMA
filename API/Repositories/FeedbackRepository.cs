using API.DatabaseContexts;
using API.Models;
using API.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace API.Repositories;

public class FeedbackRepository : IFeedbackRepository
{
    private readonly ArtifactsDbContext _context;

    public FeedbackRepository(ArtifactsDbContext context)
    {
        _context = context;
    }

    public void SubmitFeedback(ArtifactFeedback feedback)
    {
        var existing = _context.Feedbacks
            .FirstOrDefault(f => f.UserId == feedback.UserId && f.ArtifactId == feedback.ArtifactId);

        if (existing != null)
        {
            existing.Rating = feedback.Rating;
            existing.Comment = feedback.Comment;
            existing.Timestamp = DateTime.UtcNow;
        }
        else
        {
            _context.Feedbacks.Add(feedback);
        }
    }

    public ArtifactFeedback? GetUserFeedback(int userId, int artifactId)
    {
        return _context.Feedbacks
            .FirstOrDefault(f => f.UserId == userId && f.ArtifactId == artifactId);
    }

    public IEnumerable<ArtifactFeedback> GetFeedbacks(int artifactId)
    {
        return _context.Feedbacks
                .Where(f => f.ArtifactId == artifactId)
                .Include(f => f.User)
                .OrderByDescending(f => f.Timestamp)
                .ToList();

    }
}
