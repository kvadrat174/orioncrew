import * as t from "drizzle-orm/pg-core";
import { pgTable as table } from "drizzle-orm/pg-core";
import { trips } from "./trips";
import { users } from "./users";

export const tripUsers = table(
  "trip_users",
  {
    tripId: t
      .uuid("trip_id")
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    userId: t
      .bigint("user_id", { mode: 'number' })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: t.varchar("role", { length: 50 }).default("crew"),
    kicked: t.boolean('kicked').default(false),
    deleted_at: t.timestamp(),
  },
  (table) => [t.primaryKey({ columns: [table.tripId, table.userId] })]
);

export type DbTripUser = typeof tripUsers.$inferInsert