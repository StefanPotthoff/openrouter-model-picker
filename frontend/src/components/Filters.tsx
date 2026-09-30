import { useEffect, useRef } from 'react'
import { countActiveAdvancedFilters, countActiveFilters, isInvalidRange } from '../modelLogic'
import type { FilterState } from '../types'

interface FiltersProps {
  filters: FilterState
  onChange: (filters: FilterState) => void
  onReset: () => void
  visibleCount: number
  totalCount: number
  disabled: boolean
}

export function Filters({ filters, onChange, onReset, visibleCount, totalCount, disabled }: FiltersProps) {
  const update = (patch: Partial<FilterState>) => onChange({ ...filters, ...patch })
  const activeFilterCount = countActiveFilters(filters)
  const activeAdvancedCount = countActiveAdvancedFilters(filters)

  // "Erweitert" ist ein natives <details>: standardmäßig zugeklappt und öffnet sich automatisch,
  // sobald der erste Filter darin gesetzt wird (z. B. nach dem Zurücksetzen).
  const advancedRef = useRef<HTMLDetailsElement>(null)
  const previousAdvancedCount = useRef(activeAdvancedCount)

  useEffect(() => {
    const element = advancedRef.current

    if (element !== null && previousAdvancedCount.current === 0 && activeAdvancedCount > 0) {
      element.open = true
    }

    previousAdvancedCount.current = activeAdvancedCount
  }, [activeAdvancedCount])

  const resetAll = () => {
    if (advancedRef.current !== null) {
      advancedRef.current.open = false
    }

    onReset()
  }

  return (
    <section className="panel">
      <h2>Filter</h2>

      <div className="filter-grid">
        <label className="field field-wide">
          <span>Modellname oder Slug</span>
          <input
            type="text"
            placeholder="z. B. claude, qwen, deepseek"
            value={filters.search}
            onChange={(event) => update({ search: event.target.value })}
          />
        </label>

        <div className="field field-wide">
          <span>Optionen</span>
          <div className="checkbox-row">
            <label className="checkbox">
              <input
                type="checkbox"
                checked={filters.onlyWithBenchmarks}
                onChange={(event) => update({ onlyWithBenchmarks: event.target.checked })}
              />
              <span>Nur Modelle mit Benchmark-Werten</span>
            </label>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={filters.showVariants}
                onChange={(event) => update({ showVariants: event.target.checked })}
              />
              <span>Varianten (:free, :batch) und Router-Modelle anzeigen</span>
            </label>
          </div>
        </div>
      </div>

      <details className="filter-advanced" ref={advancedRef}>
        <summary>
          <span className="summary-label">Erweitert</span>
          <span className="summary-hint">Preise, Benchmarks, Context Length in Tokens</span>
          {activeAdvancedCount > 0 && <span className="badge">{activeAdvancedCount} aktiv</span>}
        </summary>

        <fieldset className="filter-group">
          <legend>Preise in $ pro 1M Tokens</legend>
          <div className="filter-grid">
            <RangeField
              label="Input-Preis"
              step={0.01}
              placeholderMin="z. B. 0.1"
              placeholderMax="z. B. 5"
              minValue={filters.minInputPrice}
              maxValue={filters.maxInputPrice}
              onMin={(value) => update({ minInputPrice: value })}
              onMax={(value) => update({ maxInputPrice: value })}
              onClear={() => update({ minInputPrice: '', maxInputPrice: '' })}
            />
            <RangeField
              label="Output-Preis"
              step={0.01}
              placeholderMin="z. B. 0.5"
              placeholderMax="z. B. 20"
              minValue={filters.minOutputPrice}
              maxValue={filters.maxOutputPrice}
              onMin={(value) => update({ minOutputPrice: value })}
              onMax={(value) => update({ maxOutputPrice: value })}
              onClear={() => update({ minOutputPrice: '', maxOutputPrice: '' })}
            />
          </div>
        </fieldset>

        <fieldset className="filter-group">
          <legend>Benchmarks</legend>
          <div className="filter-grid">
            <RangeField
              label="Coding"
              step={1}
              placeholderMin="z. B. 40"
              placeholderMax="z. B. 82"
              minValue={filters.minCoding}
              maxValue={filters.maxCoding}
              onMin={(value) => update({ minCoding: value })}
              onMax={(value) => update({ maxCoding: value })}
              onClear={() => update({ minCoding: '', maxCoding: '' })}
            />
            <RangeField
              label="Agentic"
              step={1}
              placeholderMin="z. B. 30"
              placeholderMax="z. B. 58"
              minValue={filters.minAgentic}
              maxValue={filters.maxAgentic}
              onMin={(value) => update({ minAgentic: value })}
              onMax={(value) => update({ maxAgentic: value })}
              onClear={() => update({ minAgentic: '', maxAgentic: '' })}
            />
            <RangeField
              label="Intelligence"
              step={1}
              placeholderMin="z. B. 30"
              placeholderMax="z. B. 58"
              minValue={filters.minIntelligence}
              maxValue={filters.maxIntelligence}
              onMin={(value) => update({ minIntelligence: value })}
              onMax={(value) => update({ maxIntelligence: value })}
              onClear={() => update({ minIntelligence: '', maxIntelligence: '' })}
            />
          </div>
        </fieldset>

        <fieldset className="filter-group">
          <legend>Context Length in Tokens</legend>
          <div className="filter-grid">
            <RangeField
              label="Context"
              step={1000}
              placeholderMin="z. B. 128000"
              placeholderMax="z. B. 1000000"
              minValue={filters.minContext}
              maxValue={filters.maxContext}
              onMin={(value) => update({ minContext: value })}
              onMax={(value) => update({ maxContext: value })}
              onClear={() => update({ minContext: '', maxContext: '' })}
            />
          </div>
        </fieldset>
      </details>

      <div className="filter-footer">
        <span>
          {visibleCount} von {totalCount} Modellen sichtbar
          {' · '}
          {activeFilterCount === 0 ? 'keine Filter aktiv' : `${activeFilterCount} Filter aktiv`}
        </span>
        <button
          type="button"
          className="secondary"
          onClick={resetAll}
          disabled={disabled || activeFilterCount === 0}
        >
          Filter zurücksetzen
        </button>
      </div>
    </section>
  )
}

interface RangeFieldProps {
  label: string
  minValue: string
  maxValue: string
  step: number
  placeholderMin: string
  placeholderMax: string
  onMin: (value: string) => void
  onMax: (value: string) => void
  onClear: () => void
}

/** Ein Min/Max-Paar für einen Filter (z. B. Input-Preis oder Coding). Leer = nicht eingeschränkt. */
function RangeField({
  label,
  minValue,
  maxValue,
  step,
  placeholderMin,
  placeholderMax,
  onMin,
  onMax,
  onClear,
}: RangeFieldProps) {
  const isFilled = minValue.trim() !== '' || maxValue.trim() !== ''

  return (
    <div className="range-field">
      <span className="range-label">
        {label}
        {isFilled && (
          <button type="button" className="range-clear" onClick={onClear} title={`${label}-Filter entfernen`}>
            zurücksetzen
          </button>
        )}
      </span>

      <div className="range-inputs">
        <label>
          <span>Min</span>
          <input
            type="number"
            min={0}
            step={step}
            placeholder={placeholderMin}
            value={minValue}
            onChange={(event) => onMin(event.target.value)}
          />
        </label>
        <label>
          <span>Max</span>
          <input
            type="number"
            min={0}
            step={step}
            placeholder={placeholderMax}
            value={maxValue}
            onChange={(event) => onMax(event.target.value)}
          />
        </label>
      </div>

      {isInvalidRange(minValue, maxValue) && (
        <span className="field-warning">Min ist größer als Max – so kann kein Modell passen.</span>
      )}
    </div>
  )
}
