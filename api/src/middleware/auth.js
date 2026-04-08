import pool from '../db/pool.js'

export default async function auth(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing auth token' })
  }

  const token = header.slice(7)
  const { rows } = await pool.query(
    'SELECT username FROM players WHERE auth_token = $1',
    [token]
  )

  if (rows.length === 0) {
    return res.status(401).json({ error: 'Invalid auth token' })
  }

  req.player = rows[0].username
  next()
}
