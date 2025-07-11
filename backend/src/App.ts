import { Elysia, t } from "elysia";
import { node } from "@elysiajs/node";
import { telegramBotWebhook } from "./tg/webhook";
import TelegramBot from "./tg/TelegramBot";
import TripsService from "./Trips";
import { cors } from "@elysiajs/cors";
import { getTypeText } from "./helpers";

const PORT = 3500;
const HOSTNAME = "127.0.0.1";

const create = async () => {
  const tgBot = await TelegramBot.create(process.env.BOT_TOKEN);
  const tripsService = await TripsService.create();

  const app = new Elysia({ adapter: node() })
    .use(cors())
    .use(telegramBotWebhook(tgBot.bot, process.env.BOT_TOKEN))
    
    // Основной эндпоинт для получения всех поездок
    .get("/trips", () => {
      const trips = tripsService.getTrips();
      const lastUpdated = tripsService.getLastUpdated();
      
      return trips;
    })
    
    // Получить поездки по дате
    .get("/trips/date/:date", ({ params }) => {
      const trips = tripsService.getTrips();
      const filteredTrips = trips.filter(trip => trip.date === params.date);
      
      return {
        date: params.date,
        trips: filteredTrips,
        count: filteredTrips.length
      };
    })
    
    // Получить поездки по типу активности
    .get("/trips/type/:type", ({ params }) => {
      const trips = tripsService.getTrips();
      const filteredTrips = trips.filter(trip => trip.type === params.type);
      
      return {
        type: params.type,
        trips: filteredTrips,
        count: filteredTrips.length
      };
    })
    
    // Получить поездки за диапазон дат
    .get("/trips/range", ({ query }) => {
      const trips = tripsService.getTrips();
      const { from, to } = query as { from?: string; to?: string };
      
      let filteredTrips = trips;
      
      if (from) {
        filteredTrips = filteredTrips.filter(trip => trip.date >= from);
      }
      
      if (to) {
        filteredTrips = filteredTrips.filter(trip => trip.date <= to);
      }
      
      return {
        from,
        to,
        trips: filteredTrips,
        count: filteredTrips.length
      };
    })
    .post("/trips/join", async ({ body: { userId, tripId } }) => {
        const response = await tripsService.updateParticipant(userId, tripId, '1')
        const trips = tripsService.getTrips();
        await tgBot.bot.api.sendMessage(userId, `Вы записались на ${getTypeText(response.type)} - ${response.date}`)
        return trips;
    },
    {
        body: t.Object({
          userId: t.String({ maxLength: 64 }),
          tripId: t.String(),
          byCaptain: t.Boolean()
        }),
        response: t.Any(),
        detail: { tags: ['Season2'] },
      },
    )
    .post("/trips/leave", async ({ body: { userId, tripId } }) => {
        const response = await tripsService.updateParticipant(userId, tripId, '')
        const trips = tripsService.getTrips();

        await tgBot.bot.api.sendMessage(userId, `Вы были выписаны с ${getTypeText(response.type)} - ${response.date}`)
        return trips;
    },
    {
        body: t.Object({
          userId: t.String({ maxLength: 64 }),
          tripId: t.String(),
          byCaptain: t.Boolean()
        }),
        response: t.Any(),
        detail: { tags: ['Season2'] },
      },
    )
    
    // Получить статистику по поездкам
    .get("/trips/stats", () => {
      const trips = tripsService.getTrips();
      const lastUpdated = tripsService.getLastUpdated();
      
      // Группировка по типам активности
      const typeStats = trips.reduce((acc, trip) => {
        acc[trip.type] = (acc[trip.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      // Группировка по датам
      const dateStats = trips.reduce((acc, trip) => {
        acc[trip.date] = (acc[trip.date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      // Общая статистика по участникам
      const totalParticipants = trips.reduce((sum, trip) => sum + trip.crew.length, 0);
      const avgParticipantsPerTrip = trips.length > 0 ? totalParticipants / trips.length : 0;
      
      return {
        totalTrips: trips.length,
        totalParticipants,
        avgParticipantsPerTrip: Math.round(avgParticipantsPerTrip * 100) / 100,
        typeStats,
        dateStats,
        lastUpdated: lastUpdated?.toISOString()
      };
    })
    
    // Ручное обновление данных (для отладки)
    .post("/trips/refresh", async () => {
      try {
        await tripsService.updateTrips();
        const trips = tripsService.getTrips();
        const lastUpdated = tripsService.getLastUpdated();
        
        return {
          success: true,
          message: "Trips data refreshed successfully",
          count: trips.length,
          lastUpdated: lastUpdated?.toISOString()
        };
      } catch (error) {
        return {
          success: false,
          message: "Failed to refresh trips data",
          error: error instanceof Error ? error.message : "Unknown error"
        };
      }
    })
    
    .get("/trips/status", () => {
      const trips = tripsService.getTrips();
      const lastUpdated = tripsService.getLastUpdated();
      
      return {
        status: "running",
        tripsCount: trips.length,
        lastUpdated: lastUpdated?.toISOString(),
        nextUpdate: "Every minute via cron job"
      };
    })
    
    .listen(PORT, ({ hostname, port }) => {
      console.log(`🦊 Elysia is running at ${HOSTNAME}:${port}`);
    });

  console.log(`
    🦊 Elysia is running at http://${HOSTNAME}:${PORT}/
    
    Available endpoints:
    - GET  /trips              - Get all trips
    - GET  /trips/date/:date   - Get trips by date (YYYY-MM-DD)
    - GET  /trips/type/:type   - Get trips by activity type
    - GET  /trips/range        - Get trips by date range (?from=YYYY-MM-DD&to=YYYY-MM-DD)
    - GET  /trips/stats        - Get trips statistics
    - GET  /trips/status       - Get service status
    - POST /trips/refresh      - Manually refresh trips data
    
    Swagger at http://${HOSTNAME}:${PORT}/swagger-super-secret-path
    Open Telegram WebApp at https://t.me/${tgBot.me.username} (send command /get_webapp_links)
  `);

  const stop = async () => {
    // Останавливаем cron job в tripsService
    tripsService.stop();
    
    app.server?.stop(true);
    await app.stop();
    await tgBot.bot.stop();
    
    console.log("🛑 Application stopped");
  };

  return { app, tripsService, stop };
};

export type App = Awaited<ReturnType<typeof create>>["app"];
export default {
  create,
};