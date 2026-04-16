using System.ComponentModel.DataAnnotations;

namespace Mission11_Thurman.Models;

public class BookInputDto
{
    [Required]
    [MaxLength(500)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [MaxLength(500)]
    public string Author { get; set; } = string.Empty;

    [Required]
    [MaxLength(500)]
    public string Publisher { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string ISBN { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string Classification { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string Category { get; set; } = string.Empty;

    [Range(0, int.MaxValue, ErrorMessage = "Page count cannot be negative.")]
    public int PageCount { get; set; }

    [Range(0, double.MaxValue, ErrorMessage = "Price must be zero or greater.")]
    public decimal Price { get; set; }
}
