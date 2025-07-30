import * as t from 'drizzle-orm/pg-core'
import { pgTable as table } from 'drizzle-orm/pg-core'
import { timestamps } from '../column.helpers'


export const trips = table('trips', {
  id: t.uuid('id').primaryKey().defaultRandom(),
  type: t.varchar('type', { length: 50 }).notNull(),
  departure: t.timestamp('departure').notNull(),
  duration: t.numeric('duration').default('3'),
  vessel: t.varchar('vessel', { length: 50 }).default('Orion'),
  status: t.varchar('status', { length: 20 }).default('planned'),
  ...timestamps,
});

export type DbTrip = typeof trips.$inferInsert
