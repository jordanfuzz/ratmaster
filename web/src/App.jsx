import { useState, useEffect } from 'react'
import useTasks from './hooks/useTasks.js'
import TaskListPage from './pages/TaskListPage.jsx'
import GroupPage from './pages/GroupPage.jsx'

const TABS = [
  { id: 'tasks', label: 'Tasks' },
  { id: 'group', label: 'Group' },
]

export default function App() {
  const { tasks, loading: tasksLoading } = useTasks()
  const [tab, setTab] = useState('tasks')
  const [username, setUsername] = useState(
    () => localStorage.getItem('ratmaster:username') || ''
  )
  const [usernameInput, setUsernameInput] = useState(username)

  useEffect(() => {
    if (username) localStorage.setItem('ratmaster:username', username)
  }, [username])

  function handleSetUsername(e) {
    e.preventDefault()
    setUsername(usernameInput.trim())
  }

  if (tasksLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-osrs-gold text-lg">Loading task data...</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <header className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-osrs-gold">Ratmaster</h1>
          <form onSubmit={handleSetUsername} className="flex gap-2">
            <input
              type="text"
              value={usernameInput}
              onChange={e => setUsernameInput(e.target.value)}
              placeholder="RSN"
              className="bg-osrs-panel border border-osrs-border rounded px-3 py-1.5 text-sm text-osrs-white placeholder:text-osrs-text/50 focus:border-osrs-gold focus:outline-none"
            />
            <button
              type="submit"
              className="bg-osrs-gold text-osrs-dark px-3 py-1.5 rounded text-sm font-medium hover:brightness-110"
            >
              Load
            </button>
          </form>
        </div>
        <nav className="flex gap-1 border-b border-osrs-border">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 text-sm font-medium -mb-px border-b-2 transition-colors ${
                tab === t.id
                  ? 'border-osrs-gold text-osrs-gold'
                  : 'border-transparent text-osrs-text hover:text-osrs-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      {tab === 'tasks' && <TaskListPage tasks={tasks} username={username} />}
      {tab === 'group' && <GroupPage tasks={tasks} />}
    </div>
  )
}
