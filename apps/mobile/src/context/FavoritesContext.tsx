import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { Match } from '../types/match'
import { loadLocalFavorites, syncFavoritesFromServer, toggleFavorite as toggleFav } from '../lib/favorites'

interface FavoritesContextValue {
  favoriteIds: Set<string>
  loading: boolean
  toggle: (match: Match) => Promise<void>
  refresh: () => Promise<void>
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null)

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const list = await syncFavoritesFromServer()
    setFavoriteIds(new Set(list.map((m) => m.id)))
  }, [])

  useEffect(() => {
    refresh().finally(() => setLoading(false))
  }, [refresh])

  const toggle = useCallback(async (match: Match) => {
    const added = await toggleFav(match)
    setFavoriteIds((prev) => {
      const next = new Set(prev)
      if (added) next.add(match.id)
      else next.delete(match.id)
      return next
    })
  }, [])

  const value = useMemo(
    () => ({ favoriteIds, loading, toggle, refresh }),
    [favoriteIds, loading, toggle, refresh]
  )

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext)
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider')
  return ctx
}
