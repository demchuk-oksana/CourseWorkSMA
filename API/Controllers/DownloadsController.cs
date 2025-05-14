using API.DTOs;
using API.Models;
using API.UnitOfWork;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Route("api/downloads")]
public class DownloadsController : ControllerBase
{
    private readonly IUnitOfWork _uow;

    public DownloadsController(IUnitOfWork uow)
    {
        _uow = uow;
    }

    [Authorize]
    [HttpPost("file")]
    public IActionResult DownloadFile([FromQuery] int artifactId, [FromQuery] int? versionId)
    {
        var username = User.Identity?.Name;
        var user = _uow.UserRepository.GetByUsername(username!);
        if (user == null) return Unauthorized();

        var artifact = _uow.SoftwareDevArtifactRepository.GetById(artifactId);
        if (artifact == null) return NotFound("Artifact not found.");

        var storagePath = Path.Combine(Directory.GetCurrentDirectory(), "filesstorage");
        string fileName;
        string displayName;

        if (versionId.HasValue)
        {
            var version = artifact.Versions.FirstOrDefault(v => v.Id == versionId.Value);
            if (version == null)
                return NotFound("Version not found.");

            fileName = version.DownloadUrl;
            displayName = $"{artifact.Title}_v{version.VersionNumber}";
            _uow.DownloadRepository.LogDownload(new DownloadHistory
            {
                UserId = user.Id,
                ArtifactId = artifact.Id,
                VersionId = version.Id
            });
        }
        else
        {
            fileName = artifact.Url;
            displayName = artifact.Title;
            _uow.DownloadRepository.LogDownload(new DownloadHistory
            {
                UserId = user.Id,
                ArtifactId = artifact.Id
            });
        }

        _uow.Save();

        var fullPath = Path.Combine(storagePath, fileName);
        if (!System.IO.File.Exists(fullPath))
            return NotFound("File not found on server.");

        return PhysicalFile(fullPath, "application/octet-stream", displayName);
    }
}

