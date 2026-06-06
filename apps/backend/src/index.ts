import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import { Redis } from 'ioredis'
import { initDb } from './db'
import matchesRoute from './routes/matches'
import scoreRoute from './routes/score'
import favoritesRoute from './routes/favorites'
import devicesRoute from './routes/devices'
import { initStoreRedis } from './services/store'

const redisUrl = process.env.UPSTASH_REDIS_URL
const cricApiKey = process.env.CRICAPI_KEY

if (!redisUrl || redisUrl.includes('your_upstash_url_here')) {
  console.error('Missing UPSTASH_REDIS_URL — set it in apps/backend/.env')
  process.exit(1)
}
if (!cricApiKey || cricApiKey.includes('your_cricapi_key_here')) {
  console.error('Missing CRICAPI_KEY — set it in apps/backend/.env')
  process.exit(1)
}

const app = Fastify({ logger: true })

const redis = new Redis(redisUrl, { maxRetriesPerRequest: 3 })
app.decorate('redis', redis)
initStoreRedis(redis)

async function start() {
  const dbReady = await initDb()
  app.log.info(dbReady ? 'PostgreSQL connected' : 'Using Redis for favorites (set DATABASE_URL for Postgres)')

  app.register(cors, { origin: '*' })
  app.register(matchesRoute)
  app.register(scoreRoute)
  app.register(favoritesRoute)
  app.register(devicesRoute)

  app.get('/health', async () => ({
    status: 'ok',
    ts: Date.now(),
    db: dbReady ? 'postgres' : 'redis',
  }))

  app.listen({ port: Number(process.env.PORT) || 3000, host: '0.0.0.0' }, (err) => {
    if (err) { app.log.error(err); process.exit(1) }
  })
}

start()
