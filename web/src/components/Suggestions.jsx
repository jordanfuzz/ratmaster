import { filterTasks, sortTasks } from '../lib/tasks.js'
import TaskRow from './TaskRow.jsx'

export default function Suggestions({ tasks, completedIds, unlockedRegions }) {
  // Phase 1: highest-point incomplete tasks in unlocked regions
  const suggestions = sortTasks(
    filterTasks(tasks, {
      completedIds,
      unlockedRegions,
      filters: { completion: 'incomplete' },
    }),
    { sortBy: 'points', sortDir: 'desc' }
  ).slice(0, 10)

  if (suggestions.length === 0) {
    return (
      <div className="bg-osrs-panel rounded-lg border border-osrs-border p-4 text-center text-osrs-text">
        No suggestions available. Complete more tasks or unlock more regions!
      </div>
    )
  }

  return (
    <div className="bg-osrs-panel rounded-lg border border-osrs-border overflow-hidden">
      <div className="px-3 py-2 border-b border-osrs-border">
        <h3 className="text-sm font-medium text-osrs-gold">
          Suggested Next Tasks
        </h3>
        <p className="text-xs text-osrs-text">
          Highest-value incomplete tasks in your unlocked regions
        </p>
      </div>
      {suggestions.map(task => (
        <TaskRow key={task.id} task={task} completed={false} />
      ))}
    </div>
  )
}
