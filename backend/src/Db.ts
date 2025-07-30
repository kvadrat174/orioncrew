import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './db/schema'

const create = () => {
  const pool = new Pool({
    connectionString: process.env.DB_URL,
    ssl: {
      rejectUnauthorized: true,
      ca: process.env.ROOT_SERT,
    },
    maxLifetimeSeconds: 60,
    idleTimeoutMillis: 30000,
  })

  const db = drizzle({ client: pool, schema })

  return { db }
}

export type Db = Awaited<ReturnType<typeof Db.create>>
export const Db = { create }
