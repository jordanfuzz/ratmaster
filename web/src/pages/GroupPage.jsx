import { useState, useMemo } from 'react'
import useGroup from '../hooks/useGroup.js'

export default function GroupPage({ tasks }) {
  const [input, setInput] = useState(
    () => localStorage.getItem('ratmaster:group') || ''
  )
  const [usernames, setUsernames] = useState(() => {
    const saved = localStorage.getItem('ratmaster:group') || ''
    return saved
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
  })

  const { data, loading, error, refresh } = useGroup(usernames)

  function handleSubmit(e) {
    e.preventDefault()
    const names = input
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
    localStorage.setItem('ratmaster:group', input)
    setUsernames(names)
  }

  const players = data?.players || []

  const analysis = useMemo(() => {
    if (players.length < 2) return null

    const completedSets = players.map(
      p => new Set(p.completedTaskIds || [])
    )

    // Tasks no one has done
    const noneCompleted = tasks.filter(t =>
      completedSets.every(s => !s.has(t.id))
    )

    // Tasks someone has done that others haven't
    const couldHelp = tasks.filter(t => {
      const who = completedSets.filter(s => s.has(t.id))
      return who.length > 0 && who.length < completedSets.length
    })

    return { noneCompleted, couldHelp }
  }, [players, tasks])

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Comma-separated RSNs"
          className="bg-osrs-panel border border-osrs-border rounded px-3 py-1.5 text-sm text-osrs-white placeholder:text-osrs-text/50 focus:border-osrs-gold focus:outline-none flex-1"
        />
        <button
          type="submit"
          className="bg-osrs-gold text-osrs-dark px-4 py-1.5 rounded text-sm font-medium hover:brightness-110"
        >
          Load Group
        </button>
      </form>

      {loading && <p className="text-osrs-text">Loading group data...</p>}
      {error && <p className="text-osrs-red">{error.message}</p>}

      {players.length > 0 && (
        <div className="space-y-6">
          {/* Per-player summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {players.map(p => (
              <div
                key={p.username}
                className="bg-osrs-panel rounded-lg border border-osrs-border p-4"
              >
                <div className="text-sm font-medium text-osrs-gold mb-1">
                  {p.username}
                </div>
                <div className="text-xs text-osrs-text">
                  {p.completedTaskIds.length} tasks completed
                </div>
                <div className="text-xs text-osrs-text">
                  {p.completedTaskIds.reduce((sum, id) => {
                    const task = tasks.find(t => t.id === id)
                    return sum + (task?.points || 0)
                  }, 0).toLocaleString()}{' '}
                  points
                </div>
                <div className="text-xs text-osrs-text">
                  Regions: {p.unlockedRegions.join(', ') || 'none'}
                </div>
              </div>
            ))}
          </div>

          {analysis && (
            <>
              {/* Tasks no one has done */}
              <div className="bg-osrs-panel rounded-lg border border-osrs-border p-4">
                <h3 className="text-sm font-medium text-osrs-gold mb-2">
                  Tasks No One Has Done ({analysis.noneCompleted.length})
                </h3>
                <div className="text-xs text-osrs-text max-h-60 overflow-y-auto space-y-1">
                  {analysis.noneCompleted
                    .sort((a, b) => b.points - a.points)
                    .slice(0, 20)
                    .map(t => (
                      <div key={t.id} className="flex justify-between">
                        <span>{t.name}</span>
                        <span className="text-osrs-gold">{t.points}pts</span>
                      </div>
                    ))}
                  {analysis.noneCompleted.length > 20 && (
                    <div className="text-osrs-text/50 pt-1">
                      ...and {analysis.noneCompleted.length - 20} more
                    </div>
                  )}
                </div>
              </div>

              {/* Tasks that could help others */}
              <div className="bg-osrs-panel rounded-lg border border-osrs-border p-4">
                <h3 className="text-sm font-medium text-osrs-gold mb-2">
                  Tasks Someone Could Help With ({analysis.couldHelp.length})
                </h3>
                <div className="text-xs text-osrs-text max-h-60 overflow-y-auto space-y-1">
                  {analysis.couldHelp
                    .sort((a, b) => b.points - a.points)
                    .slice(0, 20)
                    .map(t => {
                      const doneBy = players
                        .filter(p => p.completedTaskIds.includes(t.id))
                        .map(p => p.username)
                      return (
                        <div key={t.id} className="flex justify-between gap-2">
                          <span className="truncate">{t.name}</span>
                          <span className="text-osrs-green whitespace-nowrap">
                            {doneBy.join(', ')}
                          </span>
                        </div>
                      )
                    })}
                  {analysis.couldHelp.length > 20 && (
                    <div className="text-osrs-text/50 pt-1">
                      ...and {analysis.couldHelp.length - 20} more
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          <button
            onClick={refresh}
            className="text-sm text-osrs-gold hover:text-osrs-white"
          >
            Refresh
          </button>
        </div>
      )}
    </div>
  )
}
