namespace OpenRouterModelPicker.Api.OpenRouter;

/// <summary>Wird geworfen, wenn OpenRouter nicht oder nicht verwertbar antwortet.</summary>
public sealed class OpenRouterException(string message) : Exception(message);
