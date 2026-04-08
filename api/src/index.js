import express from 'express'
import playerRoutes from './routes/players.js'

const app = express()
const PORT = process.env.PORT || 3000

app.use(express.json())

app.get('/api/health', (req, res) => res.json({ status: 'ok' }))
app.use('/api', playerRoutes)

app.listen(PORT, () => {
  console.log(`Ratmaster API listening on port ${PORT}`)
})
