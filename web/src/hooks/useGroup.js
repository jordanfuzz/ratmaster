import { useState, useEffect, useCallback } from 'react'
import { fetchGroup } from '../lib/api.js'

export default function useGroup(usernames) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const load = useCallback(() => {
    if (!usernames || usernames.length === 0) return
    setLoading(true)
    setError(null)
    fetchGroup(usernames)
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [usernames?.join(',')])

  useEffect(() => {
    load()
  }, [load])

  return { data, loading, error, refresh: load }
}
