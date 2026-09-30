using System.Globalization;
using System.Net.Http.Headers;
using System.Text.Json;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using OpenRouterModelPicker.Api.Contracts;

namespace OpenRouterModelPicker.Api.OpenRouter;

/// <summary>
/// Ruft die Modelldaten live von OpenRouter ab und normalisiert sie für das Frontend.
/// Es findet keine dauerhafte Speicherung statt – nur ein kurzer In-Memory-Cache.
/// </summary>
public sealed class OpenRouterClient(
    HttpClient httpClient,
    IOptions<OpenRouterOptions> options,
    IMemoryCache cache,
    ILogger<OpenRouterClient> logger)
{
    private const string CacheKey = "openrouter:models";
    private const string RequestUri = "models?limit=1000";

    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly OpenRouterOptions _options = options.Value;

    /// <summary>Alle Modelle mit Preisen, Context Length und Benchmark-Werten.</summary>
    public Task<ModelsResponseDto> GetModelsAsync(bool refresh, CancellationToken cancellationToken)
        => GetCachedAsync(refresh, cancellationToken);

    /// <summary>Nur Modelle, für die mindestens ein Benchmark-Wert vorliegt.</summary>
    public async Task<ModelsResponseDto> GetBenchmarksAsync(bool refresh, CancellationToken cancellationToken)
    {
        var all = await GetCachedAsync(refresh, cancellationToken);
        var withBenchmarks = all.Models
            .Where(model => model.Coding is not null || model.Agentic is not null || model.Intelligence is not null)
            .ToList();

        return all with
        {
            Models = withBenchmarks,
            TotalCount = withBenchmarks.Count,
            BenchmarkCount = withBenchmarks.Count
        };
    }

    private async Task<ModelsResponseDto> GetCachedAsync(bool refresh, CancellationToken cancellationToken)
    {
        if (!refresh && cache.TryGetValue(CacheKey, out ModelsResponseDto? cached) && cached is not null)
        {
            return cached;
        }

        var result = await FetchAsync(cancellationToken);

        if (_options.CacheSeconds > 0)
        {
            cache.Set(CacheKey, result, TimeSpan.FromSeconds(_options.CacheSeconds));
        }

        return result;
    }

    private async Task<ModelsResponseDto> FetchAsync(CancellationToken cancellationToken)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, RequestUri);

        if (!string.IsNullOrWhiteSpace(_options.ApiKey))
        {
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _options.ApiKey.Trim());
        }

        using var response = await httpClient.SendAsync(request, cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync(cancellationToken);
            logger.LogWarning("OpenRouter antwortete mit {Status}: {Body}", (int)response.StatusCode, Truncate(body));
            throw new OpenRouterException($"OpenRouter antwortete mit HTTP {(int)response.StatusCode} ({response.ReasonPhrase}).");
        }

        await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        var payload = await JsonSerializer.DeserializeAsync<OpenRouterModelsResponse>(stream, JsonOptions, cancellationToken)
            ?? throw new OpenRouterException("OpenRouter lieferte eine leere Antwort.");

        var models = payload.Data.Select(Map).ToList();

        return new ModelsResponseDto(
            Models: models,
            TotalCount: models.Count,
            BenchmarkCount: models.Count(model => model.Coding is not null || model.Agentic is not null || model.Intelligence is not null),
            FetchedAt: DateTimeOffset.UtcNow);
    }

    private static ModelInfoDto Map(OpenRouterModel model)
    {
        var colonIndex = model.Id.IndexOf(':', StringComparison.Ordinal);
        var isVariant = colonIndex > 0;

        var inputPrice = ToPricePerMillion(model.Pricing?.Prompt);
        var outputPrice = ToPricePerMillion(model.Pricing?.Completion);

        return new ModelInfoDto(
            Id: model.Id,
            Name: string.IsNullOrWhiteSpace(model.Name) ? model.Id : model.Name,
            Author: ResolveAuthor(model.Id),
            ContextLength: model.ContextLength,
            InputPricePerMillion: inputPrice,
            OutputPricePerMillion: outputPrice,
            Coding: model.Benchmarks?.ArtificialAnalysis?.CodingIndex,
            Agentic: model.Benchmarks?.ArtificialAnalysis?.AgenticIndex,
            Intelligence: model.Benchmarks?.ArtificialAnalysis?.IntelligenceIndex,
            IsVariant: isVariant,
            VariantSuffix: isVariant ? model.Id[(colonIndex + 1)..] : null,
            IsFree: inputPrice == 0m && outputPrice == 0m,
            HasPricing: inputPrice is not null && outputPrice is not null,
            OpenRouterUrl: $"https://openrouter.ai/{model.Id}");
    }

    /// <summary>OpenRouter liefert USD pro Token als String ("0.000002" = 2 USD / 1M Tokens).</summary>
    private static decimal? ToPricePerMillion(string? usdPerToken)
    {
        if (string.IsNullOrWhiteSpace(usdPerToken)
            || !decimal.TryParse(usdPerToken, NumberStyles.Float, CultureInfo.InvariantCulture, out var value))
        {
            return null;
        }

        // -1 steht bei Router-Modellen (z. B. openrouter/auto) für "kein Preis".
        return value < 0m ? null : Normalize(value * 1_000_000m);
    }

    /// <summary>Entfernt überflüssige Nachkommastellen, damit aus 2.000000 ein 2 wird.</summary>
    private static decimal Normalize(decimal value)
        => decimal.Parse(
            value.ToString("0.############################", CultureInfo.InvariantCulture),
            NumberStyles.Float,
            CultureInfo.InvariantCulture);

    private static string ResolveAuthor(string id)
    {
        var slashIndex = id.IndexOf('/');
        return slashIndex > 0 ? id[..slashIndex] : id;
    }

    private static string Truncate(string value)
        => value.Length <= 300 ? value : value[..300] + "…";
}
