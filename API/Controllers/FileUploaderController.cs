using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Route("api/files")]
public class FileUploadController : ControllerBase
{
    private readonly IWebHostEnvironment _env;

    public FileUploadController(IWebHostEnvironment env)
    {
        _env = env;
    }

    [Authorize]
    [HttpPost("upload")]
    public async Task<IActionResult> Upload(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("No file uploaded.");

        var storagePath = Path.Combine(_env.ContentRootPath, "filesstorage");

        if (!Directory.Exists(storagePath))
            Directory.CreateDirectory(storagePath);

        var uniqueFileName = $"{Guid.NewGuid()}_{file.FileName}";
        var fullPath = Path.Combine(storagePath, uniqueFileName);

        using (var stream = new FileStream(fullPath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        return Ok(new { fileName = uniqueFileName });
    }
}
