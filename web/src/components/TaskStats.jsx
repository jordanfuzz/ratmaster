import { getTierPoints, getAllTiers } from '../lib/tasks.js'

export default function TaskStats({ tasks, completedIds }) {
  const totalTasks = tasks.length
  const completedCount = tasks.filter(t => completedIds.has(t.id)).length
  const totalPoints = tasks.reduce((sum, t) => sum + t.points, 0)
  const earnedPoints = tasks
    .filter(t => completedIds.has(t.id))
    .reduce((sum, t) => sum + t.points, 0)

  const tiers = getAllTiers()
  const tierPoints = getTierPoints()

  return (
    <div className="bg-osrs-panel rounded-lg border border-osrs-border p-4 mb-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <div className="text-xs text-osrs-text">Tasks</div>
          <div className="text-lg font-bold text-osrs-white">
            {completedCount}
            <span className="text-osrs-text font-normal text-sm">
              /{totalTasks}
            </span>
          </div>
        </div>
        <div>
          <div className="text-xs text-osrs-text">Points</div>
          <div className="text-lg font-bold text-osrs-gold">
            {earnedPoints.toLocaleString()}
            <span className="text-osrs-text font-normal text-sm">
              /{totalPoints.toLocaleString()}
            </span>
          </div>
        </div>
        <div className="col-span-2">
          <div className="text-xs text-osrs-text mb-1">By Tier</div>
          <div className="flex gap-3 text-xs">
            {tiers.map(tier => {
              const tierTasks = tasks.filter(t => t.tier === tier)
              const tierDone = tierTasks.filter(t =>
                completedIds.has(t.id)
              ).length
              return (
                <span key={tier} className="text-osrs-text">
                  <span className="capitalize">{tier}</span>:{' '}
                  <span className="text-osrs-white">{tierDone}</span>/
                  {tierTasks.length}
                </span>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
