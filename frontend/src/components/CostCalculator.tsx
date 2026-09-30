import { formatCost, formatTokens } from '../format'
import { parseOptionalNumber, taskCost } from '../modelLogic'
import type { ModelInfo } from '../types'

interface CostCalculatorProps {
  inputTokens: string
  outputTokens: string
  onChange: (patch: { inputTokens?: string; outputTokens?: string }) => void
  /** Günstigstes und teuerstes Modell der aktuell sichtbaren Liste. */
  cheapest: ModelInfo | null
  mostExpensive: ModelInfo | null
}

export function CostCalculator({
  inputTokens,
  outputTokens,
  onChange,
  cheapest,
  mostExpensive,
}: CostCalculatorProps) {
  const inputTokensValue = parseOptionalNumber(inputTokens) ?? 0
  const outputTokensValue = parseOptionalNumber(outputTokens) ?? 0

  return (
    <section className="panel">
      <h2>Kostenrechner</h2>

      <div className="filter-grid">
        <label className="field">
          <span>Input Tokens</span>
          <input
            type="number"
            min={0}
            step={1000}
            value={inputTokens}
            onChange={(event) => onChange({ inputTokens: event.target.value })}
          />
        </label>

        <label className="field">
          <span>Output Tokens</span>
          <input
            type="number"
            min={0}
            step={1000}
            value={outputTokens}
            onChange={(event) => onChange({ outputTokens: event.target.value })}
          />
        </label>

        <div className="field">
          <span>Beispielaufgabe</span>
          <p className="hint">
            {formatTokens(inputTokensValue)} Input + {formatTokens(outputTokensValue)} Output Tokens
          </p>
        </div>
      </div>

      <p className="hint">
        Spalte „Kosten für Aufgabe“ = Input-Tokens ÷ 1M × Input-Preis + Output-Tokens ÷ 1M × Output-Preis.
        Modelle ohne Preisangabe (Router-Modelle) zeigen „–“.
      </p>

      {cheapest !== null && mostExpensive !== null && (
        <p className="summary">
          Günstigstes Modell: <strong>{cheapest.name}</strong> {formatCost(taskCost(cheapest, inputTokensValue, outputTokensValue))}
          {' · '}
          Teuerstes Modell: <strong>{mostExpensive.name}</strong> {formatCost(taskCost(mostExpensive, inputTokensValue, outputTokensValue))}
        </p>
      )}
    </section>
  )
}
