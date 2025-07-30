import { and, eq, inArray, isNull, not } from "drizzle-orm";
import { Db } from "src/Db";
import { DbTrip, DbTripUser, DbUser, tripUsers, trips, users } from "./schema";
import { SeaTripDto } from "src/Types";
import { getDefaultDuration, mapUserRole } from "src/helpers";

export type OrionDb = Awaited<ReturnType<typeof create>>;
const create = ({ db }: Db) => {
  async function findUser(id: number) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    if (!user) return undefined;
    return user;
  }

  async function addUser(user: DbUser) {
    return db.insert(users).values(user);
  }

  async function findTrip(id: string) {
    const [trip] = await db.select().from(trips).where(eq(trips.id, id));
    if (!trip) return undefined;
    return trip;
  }

  async function addTrip(trip: DbTrip) {
    return await db.insert(trips).values(trip).returning();
  }

  async function getTripUsers(id: string) {
    return await db.select().from(tripUsers).where(eq(tripUsers.tripId, id));
  }

  async function addTripUser(tripUser: DbTripUser) {
    return db.insert(tripUsers).values(tripUser);
  }

  async function updateTripUser(tripId: string, userId: number, updates: Partial<DbTripUser>) {
    const [updatedUserTrip] = await db.update(tripUsers).set(updates).where(and(eq(tripUsers.tripId, tripId), eq(tripUsers.userId, userId))).returning()

    return updatedUserTrip
  }

  async function getFreeCrew(tripId: string) {
    const existingCrew = await db.select()
      .from(tripUsers)
      .where(
        and(
          eq(tripUsers.tripId, tripId),
          isNull(tripUsers.deleted_at),
          eq(tripUsers.kicked, false)
        )
      )
      .execute();
  
    const freeUsers = await db.select()
      .from(users)
      .where(
        and(
          isNull(users.deleted_at),
          existingCrew.length > 0 
            ? not(inArray(users.id, existingCrew.map(u => u.userId)))
            : undefined
        )
      )
      .execute();
  
    return freeUsers.map(user => ({
      id: user.id,
      name: `${user.lastName} ${user.firstName}`.trim(),
      position: user.role,
      vessel: user.vessel
    }));
  }

  async function getTripsFromDb(): Promise<SeaTripDto[]> {
    const dbTrips = await db
      .select()
      .from(trips)
      .leftJoin(
        tripUsers,
        and(
          eq(tripUsers.tripId, trips.id),
          isNull(tripUsers.deleted_at),
          eq(tripUsers.kicked, false)
        )
      )
      .leftJoin(users, eq(users.id, tripUsers.userId))
      .execute();

    const tripsMap = new Map<string, SeaTripDto>();

    for (const row of dbTrips) {
      const trip = row.trips;
      const tripUser = row.trip_users;
      const user = row.users;

      if (!tripsMap.has(trip.id)) {
        const departureDate = new Date(trip.departure);

        // Форматируем дату и время
        const dateStr = departureDate.toISOString().split("T")[0];
        const timeStr = departureDate
          .toLocaleTimeString("ru-RU", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          })
          .replace(/^24:/, "00:");
        tripsMap.set(trip.id, {
          id: trip.id,
          type: trip.type as SeaTripDto["type"],
          departure: timeStr,
          vessel: trip.vessel,
          date: dateStr,
          crew: [],
          duration: getDefaultDuration(trip.type as SeaTripDto["type"]),
          status: trip.status as SeaTripDto["status"],
        });
      }

      if (user && tripUser) {
        const currentTrip = tripsMap.get(trip.id)!;
        currentTrip.crew.push({
          id: user.id.toString(),
          name: `${user.firstName} ${user.lastName}`.trim(),
          position: mapUserRole(tripUser.role),
          phone: undefined,
        });
      }
    }

    return Array.from(tripsMap.values());
  }

  async function getSingleTripFromDb(tripId: string): Promise<SeaTripDto> {
    const tripResults = await db
      .select()
      .from(trips)
      .where(eq(trips.id, tripId))
      .leftJoin(
        tripUsers,
        and(
          eq(tripUsers.tripId, trips.id),
          isNull(tripUsers.deleted_at),
          eq(tripUsers.kicked, false)
        )
      )
      .leftJoin(users, eq(users.id, tripUsers.userId))
      .execute();
  
    if (tripResults.length === 0) throw new Error('Trip Not found');
  
    // Берем первую запись (основные данные поездки одинаковы для всех строк)
    const firstRow = tripResults[0];
    const trip = firstRow.trips;
    const departureDate = new Date(trip.departure);
  
    // Форматируем дату и время
    const dateStr = departureDate.toISOString().split('T')[0];
    const timeStr = departureDate.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).replace(/^24:/, '00:');
  
    // Собираем объект поездки
    const result: SeaTripDto = {
      id: trip.id,
      type: trip.type as SeaTripDto['type'],
      vessel: trip.vessel,
      departure: timeStr,
      date: dateStr,
      crew: [],
      duration: getDefaultDuration(trip.type as SeaTripDto['type']),
      status: trip.status as SeaTripDto['status'],
    };
  
    // Добавляем участников (если есть)
    for (const row of tripResults) {
      if (row.users && row.trip_users) {
        result.crew.push({
          id: row.users.id.toString(),
          name: `${row.users.firstName} ${row.users.lastName}`.trim(),
          position: mapUserRole(row.trip_users.role),
          phone: undefined,
        });
      }
    }
  
    return result;
  }

  return {
    findUser,
    addUser,
    findTrip,
    addTrip,
    getTripUsers,
    addTripUser,
    getTripsFromDb,
    getSingleTripFromDb,
    updateTripUser,
    getFreeCrew,
  };
};

export default { create };
