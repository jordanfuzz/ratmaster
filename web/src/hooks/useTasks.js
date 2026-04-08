import { useState, useEffect } from 'react'
import { loadTasks } from '../lib/tasks.js'

export default function useTasks() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadTasks()
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [])

  return { data, tasks: data?.tasks || [], loading, error }
}
