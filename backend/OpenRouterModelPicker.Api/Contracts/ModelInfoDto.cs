namespace OpenRouterModelPicker.Api.Contracts;

/// <summary>
/// Ein Modell in der Form, die das Frontend direkt anzeigen kann.
/// Alle Preise sind in USD pro 1 Million Tokens; Benchmark-Werte sind nullable,
/// weil OpenRouter für viele Modelle keine Werte liefert.
/// </summary>
public sealed record ModelInfoDto(
    string Id,
    string Name,
    string Author,
    int? ContextLength,
    decimal? InputPricePerMillion,
    decimal? OutputPricePerMillion,
    double? Coding,
    double? Agentic,
    double? Intelligence,
    bool IsVariant,
    string? VariantSuffix,
    bool IsFree,
    bool HasPricing,
    string OpenRouterUrl);

/// <summary>Antwort von <c>GET /api/models</c> und <c>GET /api/benchmarks</c>.</summary>
public sealed record ModelsResponseDto(
    IReadOnlyList<ModelInfoDto> Models,
    int TotalCount,
    int BenchmarkCount,
    DateTimeOffset FetchedAt);
