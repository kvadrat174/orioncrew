import * as t from 'drizzle-orm/pg-core'
import { pgTable as table } from 'drizzle-orm/pg-core'
import { timestamps } from '../column.helpers'


export const users = table('users', {
  id: t.bigint('id', { mode: 'number' }).primaryKey(),
  firstName: t.varchar('first_name', { length: 100 }),
  lastName: t.varchar('last_name', { length: 100 }),
  username: t.varchar('username', { length: 100 }).notNull(),
  avatar: t.varchar('avatar').default('').notNull(),
  languageCode: t.varchar('language_code', { length: 20 }).notNull(),
  isBot: t.boolean(),
  isPremium: t.boolean(),
  role: t.varchar('role', { length: 20 }).default('user'),
  vessel: t.varchar('vessel', { length: 20 }).default('Orion'),
  ...timestamps,
})

export type DbUser = typeof users.$inferInsert