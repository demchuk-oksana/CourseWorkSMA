﻿using API.DTOs;
using API.Models;
using API.UnitOfWork;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using AutoMapper;
using Microsoft.EntityFrameworkCore; // Add this for AsNoTracking if needed

namespace API.Controllers;

[ApiController]
[Route("api/categories")]
public class CategoryController : ControllerBase
{
    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;

    public CategoryController(IUnitOfWork uow, IMapper mapper)
    {
        _uow = uow;
        _mapper = mapper;
    }

    private CategoryTreeDto BuildCategoryTree(Category category)
    {
        return new CategoryTreeDto
        {
            Id = category.Id,
            Name = category.Name,
            ParentCategoryId = category.ParentCategoryId,
            Subcategories = category.Subcategories.Select(BuildCategoryTree).ToList(),
            IsExpanded = category.IsExpanded
        };
    }

    // GET: /api/categories/tree
    [HttpGet("tree")]
    public IActionResult GetCategoryTree()
    {
        var rootCategories = _uow.CategoryRepository.GetRootCategories();
        var treeDtos = rootCategories.Select(BuildCategoryTree).ToList();
        return Ok(treeDtos);
    }

    [Authorize]
    [HttpPost]
    public IActionResult Create([FromBody] CategoryDto dto)
    {
        var category = new Category
        {
            Name = dto.Name,
            ParentCategoryId = dto.ParentCategoryId
        };

        _uow.CategoryRepository.Add(category);
        _uow.Save();

        return CreatedAtAction(nameof(GetCategoryById), new { id = category.Id }, category);
    }

    [HttpGet("{id}")]
    public IActionResult GetCategoryById(int id)
    {
        var cat = _uow.CategoryRepository.GetById(id);
        return cat == null ? NotFound() : Ok(cat);
    }

    [Authorize]
    [HttpPut("{id}")]
    public IActionResult Rename(int id, [FromBody] string newName)
    {
        var category = _uow.CategoryRepository.GetById(id);
        if (category == null) return NotFound();

        category.ModifyCategory(newName);
        _uow.CategoryRepository.Update(category);
        _uow.Save();

        return Ok(category);
    }

    [Authorize]
    [HttpDelete("{id}")]
    public IActionResult Delete(int id)
    {
        // Clear the EF Core change tracker before checking for emptiness
        // This ensures we don't have stale navigation collections (important if the artifact was just deleted)
        _uow.ClearChangeTracker(); // You'll need to add this method to your UnitOfWork

        var category = _uow.CategoryRepository.GetById(id);
        if (category == null) return NotFound();

        if (!_uow.CategoryRepository.IsCategoryEmpty(id))
            return BadRequest("Cannot delete non-empty category.");

        _uow.CategoryRepository.Delete(id);
        _uow.Save();

        return NoContent();
    }

    [Authorize]
    [HttpPost("rearrange")]
    public IActionResult Rearrange([FromBody] CategoryReorderDto dto)
    {
        try
        {
            _uow.CategoryRepository.Rearrange(dto.CategoryId, dto.NewParentId, dto.NewPosition);
            _uow.Save();
            return Ok();
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [Authorize]
    [HttpPost("{id}/display")]
    public IActionResult SetDisplayPreference(int id, [FromBody] bool isExpanded)
    {
       var username = User.Identity?.Name;
        Console.WriteLine($"SetDisplayPreference called by user: {username}");  
        var user = _uow.UserRepository.GetByUsername(username!);
        if (user == null) return Unauthorized();

        _uow.CategoryRepository.SetDisplayPreference(id, user.Id, isExpanded);
        _uow.Save();

        return Ok("Preference saved.");
    }

}