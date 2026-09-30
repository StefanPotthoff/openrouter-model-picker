using Microsoft.Extensions.Options;
using OpenRouterModelPicker.Api.Contracts;
using OpenRouterModelPicker.Api.OpenRouter;

var builder = WebApplication.CreateBuilder(args);

builder.Services
    .AddOptions<OpenRouterOptions>()
    .Bind(builder.Configuration.GetSection(OpenRouterOptions.SectionName));

// Ein API-Key ist optional und darf ausschließlich serverseitig liegen.
if (Environment.GetEnvironmentVariable("OPENROUTER_API_KEY") is { Length: > 0 } environmentApiKey)
{
    builder.Configuration["OpenRouter:ApiKey"] = environmentApiKey;
}

builder.Services.AddMemoryCache();
builder.Services.AddHttpClient<OpenRouterClient>((serviceProvider, client) =>
{
    var options = serviceProvider.GetRequiredService<IOptions<OpenRouterOptions>>().Value;
    client.BaseAddress = new Uri(options.BaseUrl);
    client.Timeout = TimeSpan.FromSeconds(30);
    client.DefaultRequestHeaders.UserAgent.ParseAdd("openrouter-model-picker/1.0");
});

builder.Services.AddCors(options => options.AddDefaultPolicy(policy => policy
    .WithOrigins("http://localhost:5173")
    .AllowAnyHeader()
    .AllowAnyMethod()));

var app = builder.Build();

app.UseCors();

// Optional: gebautes Frontend (frontend/ -> wwwroot) im gleichen Prozess ausliefern.
var indexHtml = Path.Combine(app.Environment.WebRootPath ?? Path.Combine(app.Environment.ContentRootPath, "wwwroot"), "index.html");
if (File.Exists(indexHtml))
{
    app.UseDefaultFiles();
    app.UseStaticFiles();
}

app.MapGet("/api/models", (OpenRouterClient client, ILogger<Program> logger, bool? refresh, CancellationToken cancellationToken)
    => LoadAsync(logger, () => client.GetModelsAsync(refresh ?? false, cancellationToken)));

app.MapGet("/api/benchmarks", (OpenRouterClient client, ILogger<Program> logger, bool? refresh, CancellationToken cancellationToken)
    => LoadAsync(logger, () => client.GetBenchmarksAsync(refresh ?? false, cancellationToken)));

app.MapGet("/api/health", () => Results.Ok(new { status = "ok", utc = DateTimeOffset.UtcNow }));

if (File.Exists(indexHtml))
{
    app.MapFallbackToFile("index.html");
}

app.Run();

static async Task<IResult> LoadAsync(ILogger logger, Func<Task<ModelsResponseDto>> load)
{
    try
    {
        return Results.Ok(await load());
    }
    catch (OpenRouterException exception)
    {
        logger.LogWarning(exception, "OpenRouter-Daten konnten nicht geladen werden");
        return Results.Problem(
            title: "OpenRouter-Daten konnten nicht geladen werden",
            detail: exception.Message,
            statusCode: StatusCodes.Status502BadGateway);
    }
    catch (OperationCanceledException exception)
    {
        logger.LogWarning(exception, "Abruf bei OpenRouter lief in einen Timeout");
        return Results.Problem(
            title: "OpenRouter-Daten konnten nicht geladen werden",
            detail: "Der Abruf bei OpenRouter hat zu lange gedauert.",
            statusCode: StatusCodes.Status504GatewayTimeout);
    }
    catch (HttpRequestException exception)
    {
        logger.LogWarning(exception, "OpenRouter ist nicht erreichbar");
        return Results.Problem(
            title: "OpenRouter-Daten konnten nicht geladen werden",
            detail: $"OpenRouter ist nicht erreichbar: {exception.Message}",
            statusCode: StatusCodes.Status502BadGateway);
    }
}

