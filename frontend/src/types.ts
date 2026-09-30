/** Ein Modell in der Form, die das Backend liefert (bereits normalisiert). */
export interface ModelInfo {
  id: string
  name: string
  author: string
  contextLength: number | null
  /** USD pro 1 Million Input-Tokens, null = kein Preis hinterlegt (z. B. Router-Modelle). */
  inputPricePerMillion: number | null
  /** USD pro 1 Million Output-Tokens. */
  outputPricePerMillion: number | null
  coding: number | null
  agentic: number | null
  intelligence: number | null
  isVariant: boolean
  variantSuffix: string | null
  isFree: boolean
  hasPricing: boolean
  openRouterUrl: string
}

/** Antwort von GET /api/models bzw. GET /api/benchmarks. */
export interface ModelsResponse {
  models: ModelInfo[]
  totalCount: number
  benchmarkCount: number
  fetchedAt: string
}

export type SortKey =
  | 'name'
  | 'inputPricePerMillion'
  | 'outputPricePerMillion'
  | 'coding'
  | 'agentic'
  | 'intelligence'
  | 'contextLength'
  | 'taskCost'

export type SortDirection = 'asc' | 'desc'

/**
 * Filterwerte als Strings, damit Eingabefelder leer bleiben können (= keine Einschränkung).
 * Alle gesetzten Filter werden UND-verknüpft (beliebig kombinierbar).
 */
export interface FilterState {
  search: string
  minInputPrice: string
  maxInputPrice: string
  minOutputPrice: string
  maxOutputPrice: string
  minCoding: string
  maxCoding: string
  minAgentic: string
  maxAgentic: string
  minIntelligence: string
  maxIntelligence: string
  minContext: string
  maxContext: string
  onlyWithBenchmarks: boolean
  showVariants: boolean
}

export const emptyFilters: FilterState = {
  search: '',
  minInputPrice: '',
  maxInputPrice: '',
  minOutputPrice: '',
  maxOutputPrice: '',
  minCoding: '',
  maxCoding: '',
  minAgentic: '',
  maxAgentic: '',
  minIntelligence: '',
  maxIntelligence: '',
  minContext: '',
  maxContext: '',
  onlyWithBenchmarks: false,
  showVariants: false,
}
