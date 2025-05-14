using API.Models;
using Microsoft.EntityFrameworkCore;

namespace API.DatabaseContexts;

public class ArtifactsDbContext : DbContext
{
    public DbSet<Category> Categories { get; set; }
    public DbSet<SoftwareDevArtifact> Artifacts { get; set; }
    public DbSet<ArtifactVersion> ArtifactVersions { get; set; }
    public DbSet<DownloadHistory> Downloads { get; set; }
    public DbSet<User> Users { get; set; }
    public DbSet<ArtifactFeedback> Feedbacks { get; set; }
    public DbSet<UserCategoryPreference> CategoryPreferences { get; set; }

    public ArtifactsDbContext(DbContextOptions<ArtifactsDbContext> options) : base(options) { }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Category>()
            .HasMany(c => c.Subcategories)
            .WithOne(c => c.ParentCategory)
            .HasForeignKey(c => c.ParentCategoryId);

        modelBuilder.Entity<SoftwareDevArtifact>()
            .HasOne(a => a.Category)
            .WithMany(c => c.Artifacts)
            .HasForeignKey(a => a.CategoryId);

        modelBuilder.Entity<DownloadHistory>()
            .HasOne(d => d.Artifact)
            .WithMany()
            .HasForeignKey(d => d.ArtifactId);

        modelBuilder.Entity<DownloadHistory>()
            .HasOne(d => d.Version)
            .WithMany()
            .HasForeignKey(d => d.VersionId)
            .IsRequired(false);

        modelBuilder.Entity<ArtifactFeedback>()
            .HasIndex(f => new { f.UserId, f.ArtifactId })
            .IsUnique();

        modelBuilder.Entity<ArtifactFeedback>()
            .HasOne(f => f.Artifact)
            .WithMany(a => a.Feedbacks)
            .HasForeignKey(f => f.ArtifactId);

        modelBuilder.Entity<Category>()
            .HasMany(c => c.Subcategories)
            .WithOne(c => c.ParentCategory)
            .HasForeignKey(c => c.ParentCategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<UserCategoryPreference>()
            .HasIndex(p => new { p.UserId, p.CategoryId })
            .IsUnique();

        modelBuilder.Entity<UserCategoryPreference>()
            .HasOne(p => p.Category)
            .WithMany()
            .HasForeignKey(p => p.CategoryId);
    }
}
