import { getAllRegions, getAllTiers } from '../lib/tasks.js'

const SORT_OPTIONS = [
  { value: 'points', label: 'Points' },
  { value: 'name', label: 'Name' },
  { value: 'tier', label: 'Tier' },
  { value: 'region', label: 'Region' },
]

export default function TaskFilters({
  filters,
  setFilters,
  sortBy,
  setSortBy,
  sortDir,
  setSortDir,
  unlockedRegions,
}) {
  const regions = getAllRegions()
  const tiers = getAllTiers()

  function update(key, value) {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="flex flex-wrap gap-3 mb-4">
      <input
        type="text"
        value={filters.search || ''}
        onChange={e => update('search', e.target.value)}
        placeholder="Search tasks..."
        className="bg-osrs-panel border border-osrs-border rounded px-3 py-1.5 text-sm text-osrs-white placeholder:text-osrs-text/50 focus:border-osrs-gold focus:outline-none flex-1 min-w-[200px]"
      />

      <select
        value={filters.region || 'all'}
        onChange={e => update('region', e.target.value)}
        className="bg-osrs-panel border border-osrs-border rounded px-3 py-1.5 text-sm text-osrs-white focus:border-osrs-gold focus:outline-none"
      >
        <option value="all">All Regions</option>
        {regions.map(r => (
          <option key={r} value={r}>
            {r}
            {unlockedRegions && !unlockedRegions.has(r) && r !== 'General'
              ? ' (locked)'
              : ''}
          </option>
        ))}
      </select>

      <select
        value={filters.tier || 'all'}
        onChange={e => update('tier', e.target.value)}
        className="bg-osrs-panel border border-osrs-border rounded px-3 py-1.5 text-sm text-osrs-white focus:border-osrs-gold focus:outline-none"
      >
        <option value="all">All Tiers</option>
        {tiers.map(t => (
          <option key={t} value={t}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </option>
        ))}
      </select>

      <select
        value={filters.completion || 'all'}
        onChange={e => update('completion', e.target.value)}
        className="bg-osrs-panel border border-osrs-border rounded px-3 py-1.5 text-sm text-osrs-white focus:border-osrs-gold focus:outline-none"
      >
        <option value="all">All Tasks</option>
        <option value="incomplete">Incomplete</option>
        <option value="completed">Completed</option>
      </select>

      <div className="flex items-center gap-1">
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          className="bg-osrs-panel border border-osrs-border rounded px-3 py-1.5 text-sm text-osrs-white focus:border-osrs-gold focus:outline-none"
        >
          {SORT_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <button
          onClick={() => setSortDir(d => (d === 'desc' ? 'asc' : 'desc'))}
          className="bg-osrs-panel border border-osrs-border rounded px-2 py-1.5 text-sm text-osrs-white hover:border-osrs-gold"
          title={sortDir === 'desc' ? 'Descending' : 'Ascending'}
        >
          {sortDir === 'desc' ? '\u2193' : '\u2191'}
        </button>
      </div>
    </div>
  )
}
