using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Mission11_Thurman.Data;
using Mission11_Thurman.Models;

namespace Mission11_Thurman.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BooksController(BookstoreDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<PagedBooksResponse>> GetBooks(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 5,
        [FromQuery] string sortTitle = "asc",
        [FromQuery] string? category = null,
        CancellationToken cancellationToken = default)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 5;
        if (pageSize > 100) pageSize = 100;

        var query = db.Books.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(category))
        {
            query = query.Where(b => b.Category == category);
        }

        query = string.Equals(sortTitle, "desc", StringComparison.OrdinalIgnoreCase)
            ? query.OrderByDescending(b => b.Title)
            : query.OrderBy(b => b.Title);

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return Ok(new PagedBooksResponse(items, totalCount, page, pageSize));
    }

    [HttpGet("categories")]
    public async Task<ActionResult<IReadOnlyList<string>>> GetCategories(
        CancellationToken cancellationToken = default)
    {
        var categories = await db.Books
            .AsNoTracking()
            .Select(b => b.Category)
            .Distinct()
            .OrderBy(c => c)
            .ToListAsync(cancellationToken);

        return Ok(categories);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<Book>> GetBook(int id, CancellationToken cancellationToken = default)
    {
        var book = await db.Books.AsNoTracking().FirstOrDefaultAsync(b => b.BookID == id, cancellationToken);
        if (book is null)
        {
            return NotFound();
        }

        return Ok(book);
    }

    [HttpPost]
    public async Task<ActionResult<Book>> CreateBook(
        [FromBody] BookInputDto dto,
        CancellationToken cancellationToken = default)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var book = new Book
        {
            Title = dto.Title.Trim(),
            Author = dto.Author.Trim(),
            Publisher = dto.Publisher.Trim(),
            ISBN = dto.ISBN.Trim(),
            Classification = dto.Classification.Trim(),
            Category = dto.Category.Trim(),
            PageCount = dto.PageCount,
            Price = dto.Price,
        };

        db.Books.Add(book);
        await db.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(nameof(GetBook), new { id = book.BookID }, book);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateBook(
        int id,
        [FromBody] BookInputDto dto,
        CancellationToken cancellationToken = default)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var book = await db.Books.FirstOrDefaultAsync(b => b.BookID == id, cancellationToken);
        if (book is null)
        {
            return NotFound();
        }

        book.Title = dto.Title.Trim();
        book.Author = dto.Author.Trim();
        book.Publisher = dto.Publisher.Trim();
        book.ISBN = dto.ISBN.Trim();
        book.Classification = dto.Classification.Trim();
        book.Category = dto.Category.Trim();
        book.PageCount = dto.PageCount;
        book.Price = dto.Price;

        await db.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteBook(int id, CancellationToken cancellationToken = default)
    {
        var book = await db.Books.FirstOrDefaultAsync(b => b.BookID == id, cancellationToken);
        if (book is null)
        {
            return NotFound();
        }

        db.Books.Remove(book);
        await db.SaveChangesAsync(cancellationToken);

        return NoContent();
    }
}

public record PagedBooksResponse(
    IReadOnlyList<Book> Items,
    int TotalCount,
    int Page,
    int PageSize);
