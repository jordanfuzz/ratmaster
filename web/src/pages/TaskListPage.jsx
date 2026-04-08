import { useState, useMemo } from 'react'
import usePlayer from '../hooks/usePlayer.js'
import { filterTasks, sortTasks } from '../lib/tasks.js'
import TaskFilters from '../components/TaskFilters.jsx'
import TaskRow from '../components/TaskRow.jsx'
import TaskStats from '../components/TaskStats.jsx'
import Suggestions from '../components/Suggestions.jsx'

const PAGE_SIZE = 50

export default function TaskListPage({ tasks, username }) {
  const { data: player, loading, error } = usePlayer(username)
  const [filters, setFilters] = useState({
    completion: 'incomplete',
  })
  const [sortBy, setSortBy] = useState('points')
  const [sortDir, setSortDir] = useState('desc')
  const [showCount, setShowCount] = useState(PAGE_SIZE)

  const completedIds = useMemo(
    () => new Set(player?.completedTaskIds || []),
    [player]
  )
  const unlockedRegions = useMemo(
    () => (player?.unlockedRegions ? new Set(player.unlockedRegions) : null),
    [player]
  )

  const filtered = useMemo(
    () =>
      sortTasks(
        filterTasks(tasks, { completedIds, unlockedRegions, filters }),
        { sortBy, sortDir }
      ),
    [tasks, completedIds, unlockedRegions, filters, sortBy, sortDir]
  )

  const visible = filtered.slice(0, showCount)

  return (
    <div>
      {username && loading && (
        <p className="text-osrs-text mb-4">Loading player data...</p>
      )}
      {error && (
        <p className="text-osrs-red mb-4">
          {error.message === 'Player not found'
            ? `Player "${username}" not found. Make sure the plugin has synced.`
            : error.message}
        </p>
      )}

      {player && (
        <>
          <TaskStats tasks={tasks} completedIds={completedIds} />
          <Suggestions
            tasks={tasks}
            completedIds={completedIds}
            unlockedRegions={unlockedRegions}
          />
          <div className="my-4" />
        </>
      )}

      <TaskFilters
        filters={filters}
        setFilters={setFilters}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortDir={sortDir}
        setSortDir={setSortDir}
        unlockedRegions={unlockedRegions}
      />

      <div className="text-xs text-osrs-text mb-2">
        {filtered.length} task{filtered.length !== 1 ? 's' : ''}
      </div>

      <div className="bg-osrs-panel rounded-lg border border-osrs-border overflow-hidden">
        {visible.map(task => (
          <TaskRow
            key={task.id}
            task={task}
            completed={completedIds.has(task.id)}
          />
        ))}
      </div>

      {showCount < filtered.length && (
        <button
          onClick={() => setShowCount(n => n + PAGE_SIZE)}
          className="mt-3 w-full py-2 text-sm text-osrs-gold hover:text-osrs-white border border-osrs-border rounded bg-osrs-panel"
        >
          Show more ({filtered.length - showCount} remaining)
        </button>
      )}
    </div>
  )
}
