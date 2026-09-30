import { formatContext, formatCost, formatPrice, formatScore } from '../format'
import { taskCost } from '../modelLogic'
import type { ModelInfo, SortDirection, SortKey } from '../types'

interface ModelTableProps {
  models: ModelInfo[]
  sortKey: SortKey
  sortDirection: SortDirection
  onSort: (key: SortKey) => void
  inputTokens: number
  outputTokens: number
  loading: boolean
}

interface Column {
  key: SortKey
  label: string
  numeric: boolean
}

const columns: Column[] = [
  { key: 'name', label: 'Modell', numeric: false },
  { key: 'inputPricePerMillion', label: 'Input $/1M', numeric: true },
  { key: 'outputPricePerMillion', label: 'Output $/1M', numeric: true },
  { key: 'coding', label: 'Coding', numeric: true },
  { key: 'agentic', label: 'Agentic', numeric: true },
  { key: 'intelligence', label: 'Intelligence', numeric: true },
  { key: 'contextLength', label: 'Context', numeric: true },
  { key: 'taskCost', label: 'Kosten für Aufgabe', numeric: true },
]

export function ModelTable({
  models,
  sortKey,
  sortDirection,
  onSort,
  inputTokens,
  outputTokens,
  loading,
}: ModelTableProps) {
  if (models.length === 0) {
    return (
      <p className="empty">
        {loading ? 'Modelldaten werden geladen …' : 'Keine Modelle für die aktuellen Filter.'}
      </p>
    )
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={column.numeric ? 'numeric' : undefined}
                aria-sort={ariaSort(column.key, sortKey, sortDirection)}
              >
                <button type="button" onClick={() => onSort(column.key)}>
                  {column.label}
                  <span className="sort-indicator">
                    {sortKey === column.key ? (sortDirection === 'asc' ? ' ▲' : ' ▼') : ''}
                  </span>
                </button>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {models.map((model) => (
            <tr key={model.id}>
              <td className="model">
                <a href={model.openRouterUrl} target="_blank" rel="noreferrer">{model.name}</a>
                {model.isFree && <span className="badge">free</span>}
                {model.variantSuffix !== null && <span className="badge">:{model.variantSuffix}</span>}
                <span className="meta">{model.id}</span>
              </td>
              <td className="numeric">{formatPrice(model.inputPricePerMillion)}</td>
              <td className="numeric">{formatPrice(model.outputPricePerMillion)}</td>
              <td className="numeric">{formatScore(model.coding)}</td>
              <td className="numeric">{formatScore(model.agentic)}</td>
              <td className="numeric">{formatScore(model.intelligence)}</td>
              <td className="numeric">{formatContext(model.contextLength)}</td>
              <td className="numeric cost">{formatCost(taskCost(model, inputTokens, outputTokens))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ariaSort(column: SortKey, sortKey: SortKey, direction: SortDirection) {
  if (column !== sortKey) return 'none'
  return direction === 'asc' ? 'ascending' : 'descending'
}
