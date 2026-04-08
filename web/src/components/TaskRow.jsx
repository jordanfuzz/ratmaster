const TIER_COLORS = {
  easy: 'text-green-400',
  medium: 'text-yellow-400',
  hard: 'text-red-400',
  elite: 'text-purple-400',
  master: 'text-cyan-400',
}

export default function TaskRow({ task, completed }) {
  return (
    <div
      className={`flex items-center gap-3 px-3 py-2 border-b border-osrs-border hover:bg-osrs-panel/50 ${
        completed ? 'opacity-50' : ''
      }`}
    >
      <div className="w-5 text-center">
        {completed ? (
          <span className="text-osrs-green">&#10003;</span>
        ) : (
          <span className="text-osrs-border">&#9675;</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-osrs-white truncate">{task.name}</div>
        <div className="text-xs text-osrs-text truncate">
          {task.description}
        </div>
      </div>
      <div className="text-xs text-osrs-text whitespace-nowrap">
        {task.region}
      </div>
      <div
        className={`text-xs font-medium whitespace-nowrap ${TIER_COLORS[task.tier] || ''}`}
      >
        {task.tier}
      </div>
      <div className="text-sm font-medium text-osrs-gold w-12 text-right">
        {task.points}
      </div>
    </div>
  )
}
