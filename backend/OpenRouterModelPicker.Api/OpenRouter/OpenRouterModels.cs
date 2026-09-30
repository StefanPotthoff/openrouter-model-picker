using System.Text.Json.Serialization;

namespace OpenRouterModelPicker.Api.OpenRouter;

/// <summary>Antwort von <c>GET /api/v1/models</c>. Es werden nur die benötigten Felder abgebildet.</summary>
internal sealed class OpenRouterModelsResponse
{
    [JsonPropertyName("data")]
    public List<OpenRouterModel> Data { get; init; } = [];
}

internal sealed class OpenRouterModel
{
    [JsonPropertyName("id")]
    public string Id { get; init; } = string.Empty;

    [JsonPropertyName("name")]
    public string Name { get; init; } = string.Empty;

    [JsonPropertyName("context_length")]
    public int? ContextLength { get; init; }

    [JsonPropertyName("pricing")]
    public OpenRouterPricing? Pricing { get; init; }

    [JsonPropertyName("benchmarks")]
    public OpenRouterBenchmarks? Benchmarks { get; init; }
}

/// <summary>Preisangaben von OpenRouter als String, in USD pro Token (z. B. "0.000002" = 2 USD / 1M Tokens).</summary>
internal sealed class OpenRouterPricing
{
    [JsonPropertyName("prompt")]
    public string? Prompt { get; init; }

    [JsonPropertyName("completion")]
    public string? Completion { get; init; }
}

internal sealed class OpenRouterBenchmarks
{
    [JsonPropertyName("artificial_analysis")]
    public ArtificialAnalysisBenchmarks? ArtificialAnalysis { get; init; }
}

/// <summary>Artificial-Analysis-Indizes. Einzelne Werte sind häufig <c>null</c>.</summary>
internal sealed class ArtificialAnalysisBenchmarks
{
    [JsonPropertyName("intelligence_index")]
    public double? IntelligenceIndex { get; init; }

    [JsonPropertyName("coding_index")]
    public double? CodingIndex { get; init; }

    [JsonPropertyName("agentic_index")]
    public double? AgenticIndex { get; init; }
}
