import { Router } from 'express'
import pool from '../db/pool.js'
import auth from '../middleware/auth.js'

const router = Router()

// POST /api/sync — full state upsert from plugin on login
router.post('/sync', auth, async (req, res) => {
  const username = req.player
  const { completedTaskIds = [], unlockedRegions = [] } = req.body

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Clear existing and re-insert full state
    // TODO: Is this necessary?
    await client.query('DELETE FROM player_tasks WHERE username = $1', [
      username,
    ])
    await client.query('DELETE FROM player_regions WHERE username = $1', [
      username,
    ])

    if (completedTaskIds.length > 0) {
      const taskValues = completedTaskIds
        .map((id, i) => `($1, $${i + 2})`)
        .join(', ')
      await client.query(
        `INSERT INTO player_tasks (username, task_id) VALUES ${taskValues}`,
        [username, ...completedTaskIds]
      )
    }

    if (unlockedRegions.length > 0) {
      const regionValues = unlockedRegions
        .map((_, i) => `($1, $${i + 2})`)
        .join(', ')
      await client.query(
        `INSERT INTO player_regions (username, region) VALUES ${regionValues}`,
        [username, ...unlockedRegions]
      )
    }

    await client.query(
      'UPDATE players SET last_synced_at = NOW() WHERE username = $1',
      [username]
    )

    await client.query('COMMIT')
    res.json({ ok: true })
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
})

// POST /api/update — delta push from plugin
router.post('/update', auth, async (req, res) => {
  const username = req.player
  const { newlyCompletedTaskIds = [], newlyUnlockedRegions = [] } = req.body

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    for (const taskId of newlyCompletedTaskIds) {
      await client.query(
        `INSERT INTO player_tasks (username, task_id)
         VALUES ($1, $2)
         ON CONFLICT (username, task_id) DO NOTHING`,
        [username, taskId]
      )
    }

    for (const region of newlyUnlockedRegions) {
      await client.query(
        `INSERT INTO player_regions (username, region)
         VALUES ($1, $2)
         ON CONFLICT (username, region) DO NOTHING`,
        [username, region]
      )
    }

    await client.query(
      'UPDATE players SET last_synced_at = NOW() WHERE username = $1',
      [username]
    )

    await client.query('COMMIT')
    res.json({ ok: true })
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
})

// GET /api/player/:username — public read of a player's state
router.get('/player/:username', async (req, res) => {
  const { username } = req.params

  const [playerResult, tasksResult, regionsResult] = await Promise.all([
    pool.query(
      'SELECT username, last_synced_at FROM players WHERE username = $1',
      [username]
    ),
    pool.query(
      'SELECT task_id, completed_at FROM player_tasks WHERE username = $1',
      [username]
    ),
    pool.query(
      'SELECT region, unlocked_at FROM player_regions WHERE username = $1',
      [username]
    ),
  ])

  if (playerResult.rows.length === 0) {
    return res.status(404).json({ error: 'Player not found' })
  }

  res.json({
    username: playerResult.rows[0].username,
    lastSyncedAt: playerResult.rows[0].last_synced_at,
    completedTaskIds: tasksResult.rows.map(r => r.task_id),
    completedTasks: tasksResult.rows.map(r => ({
      taskId: r.task_id,
      completedAt: r.completed_at,
    })),
    unlockedRegions: regionsResult.rows.map(r => r.region),
  })
})

// GET /api/group?usernames=a,b,c — multi-player state
router.get('/group', async (req, res) => {
  const usernames = (req.query.usernames || '')
    .split(',')
    .map(u => u.trim())
    .filter(Boolean)

  if (usernames.length === 0) {
    return res.status(400).json({ error: 'Provide usernames query parameter' })
  }

  const players = await Promise.all(
    usernames.map(async username => {
      const [playerResult, tasksResult, regionsResult] = await Promise.all([
        pool.query(
          'SELECT username, last_synced_at FROM players WHERE username = $1',
          [username]
        ),
        pool.query(
          'SELECT task_id, completed_at FROM player_tasks WHERE username = $1',
          [username]
        ),
        pool.query(
          'SELECT region, unlocked_at FROM player_regions WHERE username = $1',
          [username]
        ),
      ])

      if (playerResult.rows.length === 0) return null

      return {
        username: playerResult.rows[0].username,
        lastSyncedAt: playerResult.rows[0].last_synced_at,
        completedTaskIds: tasksResult.rows.map(r => r.task_id),
        unlockedRegions: regionsResult.rows.map(r => r.region),
      }
    })
  )

  res.json({ players: players.filter(Boolean) })
})

export default router
