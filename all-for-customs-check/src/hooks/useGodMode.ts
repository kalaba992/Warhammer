import { useCallback, useEffect, useMemo, useState } from 'react'
import { useKV } from '@/hooks'

interface GodModeState {
  godMode: boolean
  isOwner: boolean
  loading: boolean
  error: string | null
  activateGodMode: () => Promise<void>
  deactivateGodMode: () => Promise<void>
}

// Lightweight God Mode hook backed by local KV and spark user info
export function useGodMode(): GodModeState {
  const [godMode, setGodMode] = useKV<boolean>('god-mode-enabled', false)
  const [isOwner, setIsOwner] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true)
      try {
        const user = await window.spark?.user?.()
        setIsOwner(user?.isOwner ?? false)
      } catch (err) {
        console.error('Failed to fetch spark user', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
        setIsOwner(false)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [])

  const activateGodMode = useCallback(async () => {
    setGodMode(true)
  }, [setGodMode])

  const deactivateGodMode = useCallback(async () => {
    setGodMode(false)
  }, [setGodMode])

  return useMemo(() => ({
    godMode: !!godMode,
    isOwner,
    loading,
    error,
    activateGodMode,
    deactivateGodMode
  }), [godMode, isOwner, loading, error, activateGodMode, deactivateGodMode])
}

export function useGodModeActions() {
  const state = useGodMode()

  return {
    ...state,
    canAccessGodMode: state.godMode && state.isOwner
  }
}

// Guard non-UI callbacks with stored god-mode flag
export function requireGodMode<T extends unknown[], R>(fn: (...args: T) => R) {
  return (...args: T) => {
    const enabled = localStorage.getItem('god-mode-enabled') === 'true'
    if (!enabled) {
      console.warn('[WARN] God Mode required for this action')
      return
    }
    return fn(...args)
  }
}
