// Ausführen: npm run check
// Node führt die TypeScript-Datei direkt aus (Type Stripping) – ein Test-Framework ist dafür nicht nötig.
import assert from 'node:assert/strict'
import { applyFilters, countActiveAdvancedFilters, countActiveFilters, isInRange, isInvalidRange, parseOptionalNumber, sortModels, taskCost } from '../src/modelLogic.ts'
import { formatContext, formatCost, formatPrice, formatScore, formatTimestamp } from '../src/format.ts'
import { emptyFilters } from '../src/types.ts'

/** Kosten sind Gleitkommazahlen – deshalb mit Toleranz prüfen. */
const closeTo = (actual, expected, label) =>
  assert.ok(Math.abs(actual - expected) < 1e-12, `${label}: erwartet ${expected}, war ${actual}`)

const model = (overrides) => ({
  id: 'x',
  name: 'X',
  author: 'x',
  contextLength: 100000,
  inputPricePerMillion: 1,
  outputPricePerMillion: 1,
  coding: null,
  agentic: null,
  intelligence: null,
  isVariant: false,
  variantSuffix: null,
  isFree: false,
  hasPricing: true,
  openRouterUrl: 'https://openrouter.ai/x',
  ...overrides,
})

const baseFilters = {
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

// --- Eingaben ---
assert.equal(parseOptionalNumber(''), null)
assert.equal(parseOptionalNumber('   '), null)
assert.equal(parseOptionalNumber('12,5'), 12.5)
assert.equal(parseOptionalNumber('12.5'), 12.5)
assert.equal(parseOptionalNumber('abc'), null)

// --- Kostenrechner (100.000 Input / 20.000 Output) ---
const a = model({ inputPricePerMillion: 0.02, outputPricePerMillion: 0.3 })
closeTo(taskCost(a, 100_000, 20_000), 0.008, 'Modell A')
const b = model({ inputPricePerMillion: 0.01, outputPricePerMillion: 1.28 })
closeTo(taskCost(b, 100_000, 20_000), 0.0266, 'Modell B')
const c = model({ inputPricePerMillion: 0.2, outputPricePerMillion: 3.5 })
closeTo(taskCost(c, 100_000, 20_000), 0.09, 'Modell C')
assert.equal(taskCost(model({ inputPricePerMillion: null, outputPricePerMillion: null, hasPricing: false }), 100_000, 20_000), null)
assert.equal(taskCost(a, 0, 0), 0)

// --- Anzeigeformatierung (locale-unabhängig) ---
assert.equal(formatPrice(2), '$2.00')
assert.equal(formatPrice(0.0001), '$0.0001')
assert.equal(formatPrice(null), 'n/a')
assert.equal(formatCost(0.09000000000000001), '$0.09')
assert.equal(formatCost(null), '–')
assert.equal(formatScore(51.8), '51.8')
assert.equal(formatScore(null), '–')
assert.equal(formatContext(1_050_000), '1,050,000')
assert.equal(formatTimestamp('2026-09-30T06:07:32.2371327+00:00').length > 0, true)

// --- Filter ---
const models = [
  model({ id: 'base-strong', name: 'Strong', coding: 80, agentic: 50, intelligence: 55 }),
  model({ id: 'base-weak', name: 'Weak', coding: 20, agentic: 5, intelligence: 10 }),
  model({ id: 'base-noscore', name: 'NoScore' }),
  model({ id: 'base-free', name: 'Free', isFree: true, inputPricePerMillion: 0, outputPricePerMillion: 0 }),
  model({ id: 'base-batch', name: 'Batch', isVariant: true, variantSuffix: 'batch', inputPricePerMillion: 0.5, outputPricePerMillion: 0.5 }),
  model({ id: 'router', name: 'Router', inputPricePerMillion: null, outputPricePerMillion: null, hasPricing: false }),
]

assert.deepEqual(applyFilters(models, baseFilters).map((m) => m.id), ['base-strong', 'base-weak', 'base-noscore', 'base-free'])
assert.deepEqual(
  applyFilters(models, { ...baseFilters, showVariants: true }).map((m) => m.id),
  ['base-strong', 'base-weak', 'base-noscore', 'base-free', 'base-batch', 'router'],
)
assert.deepEqual(applyFilters(models, { ...baseFilters, minCoding: '50' }).map((m) => m.id), ['base-strong'])
assert.deepEqual(applyFilters(models, { ...baseFilters, minAgentic: '10' }).map((m) => m.id), ['base-strong'])
assert.deepEqual(applyFilters(models, { ...baseFilters, onlyWithBenchmarks: true }).map((m) => m.id), ['base-strong', 'base-weak'])
assert.deepEqual(applyFilters(models, { ...baseFilters, maxInputPrice: '0.6' }).map((m) => m.id), ['base-free'])
assert.deepEqual(applyFilters(models, { ...baseFilters, maxOutputPrice: '0.6' }).map((m) => m.id), ['base-free'])
assert.deepEqual(applyFilters(models, { ...baseFilters, search: 'STRONG' }).map((m) => m.id), ['base-strong'])
assert.deepEqual(applyFilters(models, { ...baseFilters, search: 'base-batch', showVariants: true }).map((m) => m.id), ['base-batch'])

// --- Bereiche (Min/Max) und Kombinationen ---
assert.deepEqual(applyFilters(models, { ...baseFilters, minCoding: '1' }).map((m) => m.id), ['base-strong', 'base-weak'])
assert.deepEqual(applyFilters(models, { ...baseFilters, maxCoding: '100' }).map((m) => m.id), ['base-strong', 'base-weak'])
assert.deepEqual(applyFilters(models, { ...baseFilters, minCoding: '20', maxCoding: '50' }).map((m) => m.id), ['base-weak'])
assert.deepEqual(applyFilters(models, { ...baseFilters, minInputPrice: '0.4', showVariants: true }).map((m) => m.id), ['base-strong', 'base-weak', 'base-noscore', 'base-batch'])
assert.deepEqual(applyFilters(models, { ...baseFilters, maxInputPrice: '0.5', showVariants: true }).map((m) => m.id), ['base-free', 'base-batch'])
assert.deepEqual(applyFilters(models, { ...baseFilters, minIntelligence: '20' }).map((m) => m.id), ['base-strong'])
assert.deepEqual(applyFilters(models, { ...baseFilters, maxIntelligence: '20' }).map((m) => m.id), ['base-weak'])
assert.deepEqual(applyFilters(models, { ...baseFilters, minContext: '200000' }).map((m) => m.id), [])
assert.equal(applyFilters(models, { ...baseFilters, minContext: '1000', maxContext: '200000' }).length, 4)
// alles gleichzeitig: Preisbereich + Coding + Context + Suche
assert.deepEqual(
  applyFilters(models, {
    ...baseFilters,
    search: 'weak',
    minCoding: '10',
    maxCoding: '40',
    minInputPrice: '0.5',
    maxInputPrice: '1.5',
    minContext: '1000',
    maxContext: '500000',
  }).map((m) => m.id),
  ['base-weak'],
)

assert.equal(isInRange(5, { min: null, max: null }), true)
assert.equal(isInRange(5, { min: 5, max: 5 }), true)
assert.equal(isInRange(4, { min: 5, max: null }), false)
assert.equal(isInRange(null, { min: 1, max: null }), false)
assert.equal(isInvalidRange('60', '40'), true)
assert.equal(isInvalidRange('40', '60'), false)
assert.equal(isInvalidRange('40', ''), false)
assert.equal(isInvalidRange('', ''), false)
assert.equal(countActiveFilters(emptyFilters), 0)
assert.equal(countActiveFilters({ ...emptyFilters, minCoding: '40' }), 1)
assert.equal(countActiveFilters({ ...emptyFilters, search: 'x', minInputPrice: '1', onlyWithBenchmarks: true }), 3)
assert.equal(countActiveAdvancedFilters(emptyFilters), 0)
assert.equal(countActiveAdvancedFilters({ ...emptyFilters, search: 'x', onlyWithBenchmarks: true }), 0)
assert.equal(countActiveAdvancedFilters({ ...emptyFilters, minCoding: '40', maxInputPrice: '5' }), 2)

// --- Sortierung (fehlende Werte immer am Ende) ---
const sortable = models.filter((m) => m.hasPricing)
assert.deepEqual(sortModels(sortable, 'coding', 'desc', 100_000, 20_000).map((m) => m.id), ['base-strong', 'base-weak', 'base-batch', 'base-free', 'base-noscore'])
assert.deepEqual(sortModels(sortable, 'coding', 'asc', 100_000, 20_000).map((m) => m.id), ['base-weak', 'base-strong', 'base-batch', 'base-free', 'base-noscore'])
assert.deepEqual(sortModels(sortable, 'inputPricePerMillion', 'asc', 100_000, 20_000).map((m) => m.id), ['base-free', 'base-batch', 'base-noscore', 'base-strong', 'base-weak'])
assert.deepEqual(sortModels(sortable, 'inputPricePerMillion', 'desc', 100_000, 20_000).map((m) => m.id), ['base-noscore', 'base-strong', 'base-weak', 'base-batch', 'base-free'])
assert.deepEqual(sortModels(sortable, 'taskCost', 'asc', 100_000, 20_000)[0].id, 'base-free')
// bei gleichen Kosten entscheidet der Name (hier alle 0,12 USD)
assert.deepEqual(sortModels(sortable, 'taskCost', 'desc', 100_000, 20_000).map((m) => m.id), ['base-noscore', 'base-strong', 'base-weak', 'base-batch', 'base-free'])

console.log('Alle Logik-Checks OK')
