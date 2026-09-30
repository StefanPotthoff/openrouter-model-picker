import { useMemo, useState } from 'react'
import { CostCalculator } from './components/CostCalculator'
import { Filters } from './components/Filters'
import { ModelTable } from './components/ModelTable'
import { formatTimestamp } from './format'
import { applyFilters, parseOptionalNumber, sortModels, taskCost } from './modelLogic'
import { emptyFilters } from './types'
import type { FilterState, ModelInfo, SortDirection, SortKey } from './types'
import { useModels } from './useModels'

const defaultInputTokens = 100_000
const defaultOutputTokens = 20_000

/** Preis- und Namensspalten sortieren aufsteigend, Benchmark-/Context-Spalten absteigend. */
const ascendingKeys: SortKey[] = ['name', 'inputPricePerMillion', 'outputPricePerMillion', 'taskCost']

export default function App() {
  const { data, loading, error, refresh } = useModels()

  const [filters, setFilters] = useState<FilterState>(emptyFilters)
  const [sortKey, setSortKey] = useState<SortKey>('coding')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [inputTokensText, setInputTokensText] = useState(String(defaultInputTokens))
  const [outputTokensText, setOutputTokensText] = useState(String(defaultOutputTokens))

  const inputTokens = parseOptionalNumber(inputTokensText) ?? 0
  const outputTokens = parseOptionalNumber(outputTokensText) ?? 0

  const visibleModels = useMemo(
    () => (data === null
      ? []
      : sortModels(applyFilters(data.models, filters), sortKey, sortDirection, inputTokens, outputTokens)),
    [data, filters, sortKey, sortDirection, inputTokens, outputTokens],
  )

  const extremes = useMemo(() => {
    let cheapest: { model: ModelInfo; cost: number } | null = null
    let mostExpensive: { model: ModelInfo; cost: number } | null = null

    for (const model of visibleModels) {
      const cost = taskCost(model, inputTokens, outputTokens)

      if (cost === null) continue
      if (cheapest === null || cost < cheapest.cost) cheapest = { model, cost }
      if (mostExpensive === null || cost > mostExpensive.cost) mostExpensive = { model, cost }
    }

    return { cheapest: cheapest?.model ?? null, mostExpensive: mostExpensive?.model ?? null }
  }, [visibleModels, inputTokens, outputTokens])

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
      return
    }

    setSortKey(key)
    setSortDirection(ascendingKeys.includes(key) ? 'asc' : 'desc')
  }

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>OpenRouter Model Picker</h1>
          <p className="subtitle">
            Preise, Context Length und Benchmark-Werte live aus der OpenRouter-API
            {data !== null && (
              <>
                {' · Stand '}{formatTimestamp(data.fetchedAt)}
                {' · '}{data.totalCount} Modelle, davon {data.benchmarkCount} mit Benchmark-Werten
              </>
            )}
          </p>
        </div>

        <button type="button" onClick={refresh} disabled={loading}>
          {loading ? 'Lädt …' : 'Aktualisieren'}
        </button>
      </header>

      {error !== null && (
        <p className="banner error">
          Die Daten konnten nicht geladen werden: {error}
        </p>
      )}

      <Filters
        filters={filters}
        onChange={setFilters}
        onReset={() => setFilters(emptyFilters)}
        visibleCount={visibleModels.length}
        totalCount={data?.models.length ?? 0}
        disabled={data === null}
      />

      <CostCalculator
        inputTokens={inputTokensText}
        outputTokens={outputTokensText}
        onChange={(patch) => {
          if (patch.inputTokens !== undefined) setInputTokensText(patch.inputTokens)
          if (patch.outputTokens !== undefined) setOutputTokensText(patch.outputTokens)
        }}
        cheapest={extremes.cheapest}
        mostExpensive={extremes.mostExpensive}
      />

      <ModelTable
        models={visibleModels}
        sortKey={sortKey}
        sortDirection={sortDirection}
        onSort={handleSort}
        inputTokens={inputTokens}
        outputTokens={outputTokens}
        loading={loading}
      />
    </div>
  )
}
