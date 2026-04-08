import { randomBytes } from 'node:crypto'
import pool from '../src/db/pool.js'

const usernames = process.argv.slice(2)

if (usernames.length === 0) {
  console.log('Usage: node scripts/seed.js <username1> [username2] ...')
  console.log('Creates player records with generated auth tokens.')
  process.exit(1)
}

async function seed() {
  for (const username of usernames) {
    const token = randomBytes(24).toString('hex')
    await pool.query(
      `INSERT INTO players (username, auth_token)
       VALUES ($1, $2)
       ON CONFLICT (username) DO UPDATE SET auth_token = $2`,
      [username, token]
    )
    console.log(`${username}: ${token}`)
  }
  await pool.end()
}

seed().catch(err => {
  console.error(err)
  process.exit(1)
})
