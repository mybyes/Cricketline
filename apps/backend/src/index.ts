import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import { Redis } from 'ioredis'
import matchesRoute from './routes/matches'
import scoreRoute from './routes/score'

const redisUrl = process.env.UPSTASH_REDIS_URL
const cricApiKey = process.env.CRICAPI_KEY

if (!redisUrl || redisUrl.includes('your_upstash_url_here')) {
  console.error('Missing UPSTASH_REDIS_URL — set it in apps/backend/.env (Upstash → Details → Redis Connection String)')
  process.exit(1)
}
if (!cricApiKey || cricApiKey.includes('your_cricapi_key_here')) {
  console.error('Missing CRICAPI_KEY — set it in apps/backend/.env')
  process.exit(1)
}

const app = Fastify({ logger: true })

// Redis client — shared across routes
const redis = new Redis(redisUrl, { maxRetriesPerRequest: 3 })
app.decorate('redis', redis)

app.register(cors, { origin: '*' })
app.register(matchesRoute)
app.register(scoreRoute)

app.get('/health', async () => ({ status: 'ok', ts: Date.now() }))

app.listen({ port: Number(process.env.PORT) || 3000, host: '0.0.0.0' }, (err) => {
  if (err) { app.log.error(err); process.exit(1) }
})
