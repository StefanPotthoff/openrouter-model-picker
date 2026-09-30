import type { FilterState, ModelInfo, SortDirection, SortKey } from './types'

/**
 * Kosten der Beispielaufgabe in USD:
 * (Input-Tokens / 1M * Input-Preis) + (Output-Tokens / 1M * Output-Preis).
 * Ohne Preise (z. B. Router-Modelle) gibt es keine Kostenschätzung.
 */
export function taskCost(model: ModelInfo, inputTokens: number, outputTokens: number): number | null {
  if (model.inputPricePerMillion === null || model.outputPricePerMillion === null) {
    return null
  }

  return (inputTokens / 1_000_000) * model.inputPricePerMillion
    + (outputTokens / 1_000_000) * model.outputPricePerMillion
}

/** Liest eine optionale Zahl aus einem Eingabefeld ("12,5" und "12.5" sind beide erlaubt). */
export function parseOptionalNumber(raw: string): number | null {
  const normalized = raw.trim().replace(',', '.')

  if (normalized === '') {
    return null
  }

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

/** Ein Min/Max-Bereich; null bedeutet "nicht eingeschränkt". */
export interface NumericRange {
  min: number | null
  max: number | null
}

/** Prüft, ob ein Wert in einen Bereich fällt. Ist ein Bereich gesetzt und der Wert fehlt, fällt er heraus. */
export function isInRange(value: number | null, range: NumericRange): boolean {
  if (range.min === null && range.max === null) {
    return true
  }

  if (value === null) {
    return false
  }

  if (range.min !== null && value < range.min) {
    return false
  }

  return range.max === null || value <= range.max
}

/** True, wenn Min und Max beide gefüllt sind, aber Min größer als Max ist. */
export function isInvalidRange(min: string, max: string): boolean {
  const minValue = parseOptionalNumber(min)
  const maxValue = parseOptionalNumber(max)
  return minValue !== null && maxValue !== null && minValue > maxValue
}

/** Die Filter, die im Bereich "Erweitert" liegen (Preise, Benchmarks, Context Length). */
function advancedFilterValues(filters: FilterState): string[] {
  return [
    filters.minInputPrice, filters.maxInputPrice,
    filters.minOutputPrice, filters.maxOutputPrice,
    filters.minCoding, filters.maxCoding,
    filters.minAgentic, filters.maxAgentic,
    filters.minIntelligence, filters.maxIntelligence,
    filters.minContext, filters.maxContext,
  ]
}

/** Zählt die gesetzten Filter im Bereich "Erweitert". */
export function countActiveAdvancedFilters(filters: FilterState): number {
  return advancedFilterValues(filters).filter((value) => parseOptionalNumber(value) !== null).length
}

/** Zählt alle gesetzten (einschränkenden) Filter – für die Anzeige im Filterbereich. */
export function countActiveFilters(filters: FilterState): number {
  return countActiveAdvancedFilters(filters)
    + (filters.search.trim() === '' ? 0 : 1)
    + (filters.onlyWithBenchmarks ? 1 : 0)
}

export function rangeFrom(min: string, max: string): NumericRange {
  return { min: parseOptionalNumber(min), max: parseOptionalNumber(max) }
}

/**
 * Wendet alle Filter an. Jeder gesetzte Filter schränkt weiter ein (UND-Verknüpfung),
 * beliebige Kombinationen sind daher möglich.
 */
export function applyFilters(models: ModelInfo[], filters: FilterState): ModelInfo[] {
  const search = filters.search.trim().toLowerCase()
  const inputPrice = rangeFrom(filters.minInputPrice, filters.maxInputPrice)
  const outputPrice = rangeFrom(filters.minOutputPrice, filters.maxOutputPrice)
  const coding = rangeFrom(filters.minCoding, filters.maxCoding)
  const agentic = rangeFrom(filters.minAgentic, filters.maxAgentic)
  const intelligence = rangeFrom(filters.minIntelligence, filters.maxIntelligence)
  const context = rangeFrom(filters.minContext, filters.maxContext)

  return models.filter((model) => {
    // Standardmäßig nur Basis-Modelle: Varianten (:free, :batch) und Router-Modelle ohne Preis ausblenden.
    if (!filters.showVariants && (model.isVariant || !model.hasPricing)) {
      return false
    }

    if (filters.onlyWithBenchmarks
      && model.coding === null
      && model.agentic === null
      && model.intelligence === null) {
      return false
    }

    if (search !== '' && !matchesSearch(model, search)) {
      return false
    }

    if (!isInRange(model.inputPricePerMillion, inputPrice)) {
      return false
    }

    if (!isInRange(model.outputPricePerMillion, outputPrice)) {
      return false
    }

    if (!isInRange(model.coding, coding)) {
      return false
    }

    if (!isInRange(model.agentic, agentic)) {
      return false
    }

    if (!isInRange(model.intelligence, intelligence)) {
      return false
    }

    if (!isInRange(model.contextLength, context)) {
      return false
    }

    return true
  })
}

export function sortModels(
  models: ModelInfo[],
  key: SortKey,
  direction: SortDirection,
  inputTokens: number,
  outputTokens: number,
): ModelInfo[] {
  const factor = direction === 'asc' ? 1 : -1

  return [...models].sort((left, right) => {
    const leftValue = valueOf(left, key, inputTokens, outputTokens)
    const rightValue = valueOf(right, key, inputTokens, outputTokens)

    // Fehlende Werte stehen immer am Ende, unabhängig von der Sortierrichtung.
    if (leftValue === null && rightValue === null) return compareByName(left, right)
    if (leftValue === null) return 1
    if (rightValue === null) return -1

    if (typeof leftValue === 'string' && typeof rightValue === 'string') {
      return factor * leftValue.localeCompare(rightValue)
    }

    const difference = (leftValue as number) - (rightValue as number)
    return difference !== 0 ? factor * difference : compareByName(left, right)
  })
}

function matchesSearch(model: ModelInfo, search: string): boolean {
  return model.name.toLowerCase().includes(search) || model.id.toLowerCase().includes(search)
}

function compareByName(left: ModelInfo, right: ModelInfo): number {
  return left.name.localeCompare(right.name)
}

function valueOf(
  model: ModelInfo,
  key: SortKey,
  inputTokens: number,
  outputTokens: number,
): string | number | null {
  switch (key) {
    case 'name':
      return model.name.toLowerCase()
    case 'inputPricePerMillion':
      return model.inputPricePerMillion
    case 'outputPricePerMillion':
      return model.outputPricePerMillion
    case 'coding':
      return model.coding
    case 'agentic':
      return model.agentic
    case 'intelligence':
      return model.intelligence
    case 'contextLength':
      return model.contextLength
    case 'taskCost':
      return taskCost(model, inputTokens, outputTokens)
  }
}
