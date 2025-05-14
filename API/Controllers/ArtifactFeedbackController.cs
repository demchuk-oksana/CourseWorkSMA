using API.DTOs;
using API.Models;
using API.UnitOfWork;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Route("api/feedback")]
public class ArtifactFeedbackController : ControllerBase
{
    private readonly IUnitOfWork _uow;

    public ArtifactFeedbackController(IUnitOfWork uow)
    {
        _uow = uow;
    }

    [Authorize]
    [HttpPost]
    public IActionResult SubmitFeedback([FromBody] FeedbackDto dto)
    {
        if (dto.Rating < 1 || dto.Rating > 5)
            return BadRequest("Rating must be between 1 and 5.");

        var username = User.Identity?.Name;
        var user = _uow.UserRepository.GetByUsername(username!);
        if (user == null) return Unauthorized();

        var existing = _uow.FeedbackRepository.GetUserFeedback(user.Id, dto.ArtifactId);

        if (existing != null)
        {
            existing.Rating = dto.Rating;
            existing.Comment = dto.Comment;
            existing.Timestamp = DateTime.UtcNow;
        }
        else
        {
            var feedback = new ArtifactFeedback
            {
                UserId = user.Id,
                ArtifactId = dto.ArtifactId,
                Rating = dto.Rating,
                Comment = dto.Comment
            };
            _uow.FeedbackRepository.SubmitFeedback(feedback);
        }

        _uow.Save();
        return Ok("Feedback submitted.");
    }

    [HttpGet("{artifactId}")]
    public IActionResult GetFeedback(int artifactId)
    {
        var feedbacks = _uow.FeedbackRepository.GetFeedbacks(artifactId)
            .Select(f => new
            {
                f.Rating,
                f.Comment,
                f.Timestamp,
                Username = f.User.Username
            }).ToList();

        var average = feedbacks.Count > 0
            ? feedbacks.Average(f => f.Rating)
            : 0;

        return Ok(new
        {
            AverageRating = average,
            Count = feedbacks.Count,
            Feedbacks = feedbacks
        });
    }
}
