using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Mission11_Thurman.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<BookstoreDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("Bookstore")));

builder.Services.AddControllers();
builder.Services.AddRazorPages();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:5173", "https://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();
var spaDistPath = Path.Combine(app.Environment.ContentRootPath, "ClientApp", "dist");
var hasSpaDist = Directory.Exists(spaDistPath);

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();

app.UseRouting();

if (hasSpaDist)
{
    var spaFiles = new PhysicalFileProvider(spaDistPath);
    app.UseDefaultFiles(new DefaultFilesOptions
    {
        FileProvider = spaFiles,
    });
    app.UseStaticFiles(new StaticFileOptions
    {
        FileProvider = spaFiles,
    });
}

app.UseCors();

app.UseAuthorization();

app.MapStaticAssets();
app.MapControllers();
app.MapRazorPages()
    .WithStaticAssets();

if (hasSpaDist)
{
    app.MapFallback(async context =>
    {
        if (context.Request.Path.StartsWithSegments("/api"))
        {
            context.Response.StatusCode = StatusCodes.Status404NotFound;
            return;
        }

        context.Response.ContentType = "text/html";
        await context.Response.SendFileAsync(Path.Combine(spaDistPath, "index.html"));
    });
}

app.Run();
