import { useState, useEffect, useCallback } from 'react'
import { fetchPlayer } from '../lib/api.js'

export default function usePlayer(username) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const load = useCallback(() => {
    if (!username) return
    setLoading(true)
    setError(null)
    fetchPlayer(username)
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [username])

  useEffect(() => {
    load()
  }, [load])

  return { data, loading, error, refresh: load }
}
