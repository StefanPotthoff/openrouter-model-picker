import type { ModelsResponse } from './types'

/**
 * Holt die Modelldaten vom eigenen Backend (das Backend spricht mit OpenRouter,
 * der API-Key liegt nie im Browser).
 */
export async function fetchModels(refresh = false): Promise<ModelsResponse> {
  const response = await fetch(`/api/models${refresh ? '?refresh=true' : ''}`)

  if (!response.ok) {
    throw new Error(await describeError(response))
  }

  return (await response.json()) as ModelsResponse
}

/** Holt nur Modelle mit Benchmark-Werten (GET /api/benchmarks). */
export async function fetchBenchmarks(refresh = false): Promise<ModelsResponse> {
  const response = await fetch(`/api/benchmarks${refresh ? '?refresh=true' : ''}`)

  if (!response.ok) {
    throw new Error(await describeError(response))
  }

  return (await response.json()) as ModelsResponse
}

async function describeError(response: Response): Promise<string> {
  const fallback = `Backend antwortete mit HTTP ${response.status} ${response.statusText}`

  try {
    const problem = (await response.json()) as { detail?: string; title?: string }
    return problem.detail ?? problem.title ?? fallback
  } catch {
    return fallback
  }
}
