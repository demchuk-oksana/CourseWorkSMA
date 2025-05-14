using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using API.UnitOfWork;
using API.Models;
using API.DTOs;

namespace API.Controllers;

[ApiController]
[Route("api/artifacts")]
public class ArtifactsController : ControllerBase
{
    private readonly IUnitOfWork _uow;

    public ArtifactsController(IUnitOfWork uow)
    {
        _uow = uow;
    }

    // GET: /api/artifacts?search=lib&language=C#&framework=net8.0
    [HttpGet]
    public IActionResult GetAll([FromQuery] ArtifactSearchQuery query)
    {
        var results = _uow.SoftwareDevArtifactRepository.FilterByCombinedCriteria(query);
        return Ok(results);
    }

    [HttpGet("{id}")]
    public IActionResult GetById(int id)
    {
        var artifact = _uow.SoftwareDevArtifactRepository.GetById(id);
        if (artifact == null) return NotFound();
        return Ok(artifact);
    }

    [HttpPost]
    public IActionResult Create([FromBody] ArtifactCreateDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var username = User.Identity?.Name ?? throw new Exception("Auth required");
        var user = _uow.UserRepository.GetByUsername(username);
        if (user == null) return Unauthorized();

        var artifact = new SoftwareDevArtifact
        {
            Title = dto.Title,
            Description = dto.Description,
            Url = dto.Url,
            Type = dto.Type,
            Author = user.Username,
            Version = dto.Version,
            ProgrammingLanguage = dto.ProgrammingLanguage,
            Framework = dto.Framework,
            LicenseType = dto.LicenseType,
            CategoryId = dto.CategoryId,
            Created = DateTime.UtcNow,
            UploaderId = user.Id
        };

        _uow.SoftwareDevArtifactRepository.Add(artifact);
        _uow.Save();

        return CreatedAtAction(nameof(GetById), new { id = artifact.Id }, artifact);
    }


    [Authorize]
    [HttpDelete("{id}")]
    public IActionResult Delete(int id)
    {
        var artifact = _uow.SoftwareDevArtifactRepository.GetById(id);
        if (artifact == null) return NotFound();

        _uow.SoftwareDevArtifactRepository.Delete(id);
        _uow.Save();

        return NoContent();
    }

    [Authorize]
    [HttpPost("{id}/versions")]
    public IActionResult AddVersion(int id, [FromBody] ArtifactVersionDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var version = new ArtifactVersion
        {
            VersionNumber = dto.VersionNumber,
            Changes = dto.Changes,
            DownloadUrl = dto.DownloadUrl,
            UploadDate = DateTime.UtcNow
        };

        try
        {
            _uow.SoftwareDevArtifactRepository.AddVersion(id, version);
            _uow.Save();
            return Ok(version);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet("{id}/versions")]
    public IActionResult GetVersions(int id)
    {
        var versions = _uow.SoftwareDevArtifactRepository.GetVersionHistory(id);
        return Ok(versions);
    }
}
