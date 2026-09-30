import { useCallback, useEffect, useState } from 'react'
import { fetchModels } from './api'
import type { ModelsResponse } from './types'

export interface ModelsState {
  data: ModelsResponse | null
  loading: boolean
  error: string | null
  /** Lädt die Daten erneut vom Backend und umgeht dessen Kurzzeit-Cache. */
  refresh: () => void
}

export function useModels(): ModelsState {
  const [data, setData] = useState<ModelsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)
  const [forceRefresh, setForceRefresh] = useState(false)

  useEffect(() => {
    let cancelled = false

    setLoading(true)
    setError(null)

    fetchModels(forceRefresh)
      .then((result) => {
        if (!cancelled) setData(result)
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(cause instanceof Error ? cause.message : String(cause))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [reloadToken, forceRefresh])

  const refresh = useCallback(() => {
    setForceRefresh(true)
    setReloadToken((token) => token + 1)
  }, [])

  return { data, loading, error, refresh }
}
