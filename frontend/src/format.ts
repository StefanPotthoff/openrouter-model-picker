// Anzeige-Formatierung bewusst locale-unabhängig ("en-US"), damit Preise und
// Benchmark-Werte überall identisch aussehen (z. B. $0.02 und 51.8 statt 51,8).

const priceFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
})

const costFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 6,
})

const integerFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
})

const scoreFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
})

const timestampFormatter = new Intl.DateTimeFormat('de-DE', {
  dateStyle: 'short',
  timeStyle: 'medium',
})

/** Preis pro 1M Tokens, z. B. "$0.02" oder "$0.0007"; ohne Preis "n/a". */
export function formatPrice(value: number | null): string {
  return value === null ? 'n/a' : `$${priceFormatter.format(value)}`
}

/** Kosten in USD, z. B. "$0.008"; ohne Preis "–". */
export function formatCost(value: number | null): string {
  return value === null ? '–' : `$${costFormatter.format(value)}`
}

/** Benchmark-Wert, z. B. "51.8"; ohne Wert "–". */
export function formatScore(value: number | null): string {
  return value === null ? '–' : scoreFormatter.format(value)
}

/** Context Length mit Tausenderpunkt, z. B. "1,050,000"; ohne Wert "–". */
export function formatContext(value: number | null): string {
  return value === null ? '–' : integerFormatter.format(value)
}

/** Token-Anzahl lesbar, z. B. "100,000". */
export function formatTokens(value: number): string {
  return integerFormatter.format(value)
}

export function formatTimestamp(isoTimestamp: string): string {
  const parsed = new Date(isoTimestamp)
  return Number.isNaN(parsed.getTime()) ? '–' : timestampFormatter.format(parsed)
}
