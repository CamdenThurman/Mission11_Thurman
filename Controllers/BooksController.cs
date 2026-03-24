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
        CancellationToken cancellationToken = default)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 5;
        if (pageSize > 100) pageSize = 100;

        var query = db.Books.AsNoTracking();
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
}

public record PagedBooksResponse(
    IReadOnlyList<Book> Items,
    int TotalCount,
    int Page,
    int PageSize);
