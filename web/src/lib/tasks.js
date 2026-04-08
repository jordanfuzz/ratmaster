let taskData = null

export async function loadTasks() {
  if (taskData) return taskData
  const res = await fetch('/data/tasks.json')
  taskData = await res.json()
  return taskData
}

export function getTierPoints() {
  return (
    taskData?.tierPoints || {
      easy: 10,
      medium: 40,
      hard: 80,
      elite: 200,
      master: 400,
    }
  )
}

export function getAllRegions() {
  if (!taskData) return []
  return [...new Set(taskData.tasks.map(t => t.region))].sort()
}

export function getAllTiers() {
  return ['easy', 'medium', 'hard', 'elite', 'master']
}

export function filterTasks(
  tasks,
  { completedIds = new Set(), unlockedRegions = null, filters = {} }
) {
  return tasks.filter(task => {
    // Region filter
    if (unlockedRegions && task.region !== 'General') {
      if (!unlockedRegions.has(task.region)) return false
    }
    if (filters.region && filters.region !== 'all') {
      if (task.region !== filters.region) return false
    }

    // Completion filter
    const completed = completedIds.has(task.id)
    if (filters.completion === 'incomplete' && completed) return false
    if (filters.completion === 'completed' && !completed) return false

    // Tier filter
    if (filters.tier && filters.tier !== 'all') {
      if (task.tier !== filters.tier) return false
    }

    // Search
    if (filters.search) {
      const q = filters.search.toLowerCase()
      if (
        !task.name.toLowerCase().includes(q) &&
        !task.description.toLowerCase().includes(q)
      ) {
        return false
      }
    }

    return true
  })
}

export function sortTasks(tasks, { sortBy = 'points', sortDir = 'desc' }) {
  const tierOrder = { easy: 0, medium: 1, hard: 2, elite: 3, master: 4 }
  return [...tasks].sort((a, b) => {
    let cmp = 0
    if (sortBy === 'points') {
      cmp = a.points - b.points
    } else if (sortBy === 'name') {
      cmp = a.name.localeCompare(b.name)
    } else if (sortBy === 'tier') {
      cmp = tierOrder[a.tier] - tierOrder[b.tier]
    } else if (sortBy === 'region') {
      cmp = a.region.localeCompare(b.region)
    }
    return sortDir === 'desc' ? -cmp : cmp
  })
}
