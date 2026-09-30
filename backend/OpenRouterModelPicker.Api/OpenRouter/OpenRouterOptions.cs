namespace OpenRouterModelPicker.Api.OpenRouter;

/// <summary>Konfiguration aus dem Abschnitt <c>OpenRouter</c> (appsettings) bzw. aus Environment Variables.</summary>
public sealed class OpenRouterOptions
{
    public const string SectionName = "OpenRouter";

    public string BaseUrl { get; set; } = "https://openrouter.ai/api/v1/";

    /// <summary>
    /// Optional. <c>GET /api/v1/models</c> funktioniert auch ohne Key; ein Key erhöht nur die Rate Limits.
    /// Der Wert bleibt ausschließlich serverseitig und wird nie an das Frontend ausgeliefert.
    /// </summary>
    public string? ApiKey { get; set; }

    /// <summary>Kurzzeit-Cache in Sekunden, damit "Aktualisieren" nicht bei jedem Request OpenRouter trifft.</summary>
    public int CacheSeconds { get; set; } = 60;
}
