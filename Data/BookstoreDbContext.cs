using Microsoft.EntityFrameworkCore;
using Mission11_Thurman.Models;

namespace Mission11_Thurman.Data;

public class BookstoreDbContext(DbContextOptions<BookstoreDbContext> options) : DbContext(options)
{
    public DbSet<Book> Books => Set<Book>();
}
