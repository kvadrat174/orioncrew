import * as t from 'drizzle-orm/pg-core'
import { pgTable as table } from 'drizzle-orm/pg-core'

export const sessions = table('sessions', {
  id: t.varchar().primaryKey(),
  userId: t.bigint('user_id', { mode: 'number' }).notNull(),
  lastActivityAt: t.timestamp('last_activity_at').defaultNow().notNull(),
  logoutAt: t.timestamp('logout_at'),
})

export type Session = typeof sessions.$inferInsert
