import Elysia, { NotFoundError, t } from 'elysia'
import { node } from "@elysiajs/node";
import { telegramBotWebhook } from "./tg/webhook";
import TelegramBot from "./tg/TelegramBot";
import schedule from "node-schedule";

import { cors } from "@elysiajs/cors";
import { DObject, getTypeText } from "./helpers";
import { Db } from "./Db";
import OrionDb from './db/orionDb'
import { CrewMemberDto, SeaTripDto } from "./Types";
import { TripsService } from "./Trips";
import { Errors } from './Errors';

const PORT = 3500;
const HOSTNAME = "127.0.0.1";

export type App = Awaited<ReturnType<typeof create>>["app"];
const create = async () => {
  const tgBot = await TelegramBot.create(process.env.BOT_TOKEN);

  const postgresDb: Db = Db.create()

  const orionDb = OrionDb.create(postgresDb)
  
  const app = new Elysia({ adapter: node() })
    .use(cors())
    .use(telegramBotWebhook(tgBot.bot, process.env.BOT_TOKEN))
    .get("/trips", () => {
      const trips = TripsService.getTrips(orionDb);

      return trips;
    })
    .get("/free-crew/:tripId", async ({ params: { tripId } }) => {
      const freeCrew = await TripsService.getFreeCrew(orionDb, tripId);

      return freeCrew;
    }, {
      response: t.Array(CrewMemberDto),
    })
    .post("/trip", async ({ body }: { body: { type: string, departure: string }}) => {
      const trip = await TripsService.createNewTrip(orionDb, body.type, body.departure);

      return trip
    },{
      body: t.Object({
        type: t.String(),
        departure: t.String({ format: 'date-time' }),
      }),
      response: DObject(SeaTripDto),
      detail: { tags: ["Season2"] },
    })
    .get("/trips/date/:date", async ({ params }) => {
      const trips = await TripsService.getTrips(orionDb);
      const filteredTrips = trips.filter((trip) => trip.date === params.date);

      return {
        date: params.date,
        trips: filteredTrips,
        count: filteredTrips.length,
      };
    })

    // Получить поездки по типу активности
    .get("/trips/type/:type", async ({ params }) => {
      const trips = await TripsService.getTrips(orionDb);
      const filteredTrips = trips.filter((trip) => trip.type === params.type);

      return {
        type: params.type,
        trips: filteredTrips,
        count: filteredTrips.length,
      };
    })

    // Получить поездки за диапазон дат
    .get("/trips/range", async ({ query }) => {
      const trips = await TripsService.getTrips(orionDb);
      const { from, to } = query as { from?: string; to?: string };

      let filteredTrips = trips;

      if (from) {
        filteredTrips = filteredTrips.filter((trip) => trip.date >= from);
      }

      if (to) {
        filteredTrips = filteredTrips.filter((trip) => trip.date <= to);
      }

      return {
        from,
        to,
        trips: filteredTrips,
        count: filteredTrips.length,
      };
    })
    .post(
      "/trips/join",
      async ({ body: { userId, tripId } }) => {
        const response = await TripsService.updateParticipant(
          orionDb,
          userId,
          tripId,
          "1"
        );
        const trips = TripsService.getTrips(orionDb);
        await tgBot.bot.api.sendMessage(
          userId,
          `Вы записались на ${getTypeText(response.type)} - ${response.date}`
        );
        return trips;
      },
      {
        body: t.Object({
          userId: t.String({ maxLength: 64 }),
          tripId: t.String(),
          byCaptain: t.Boolean(),
        }),
        response: t.Any(),
      }
    )
    .post(
      "/trips/leave",
      async ({ body: { userId, tripId } }) => {
        console.log("/trips/leave", userId, tripId)
        const response = await TripsService.updateParticipant(
          orionDb,
          userId,
          tripId,
          ""
        );
        const trips = TripsService.getTrips(orionDb);

        await tgBot.bot.api.sendMessage(
          userId,
          `Вы были выписаны с ${getTypeText(response.type)} - ${response.date}`
        );
        return trips;
      },
      {
        body: t.Object({
          userId: t.String({ maxLength: 64 }),
          tripId: t.String(),
          byCaptain: t.Boolean(),
        }),
        response: t.Any(),
        detail: { tags: ["Season2"] },
      }
    )

    // Ручное обновление данных (для отладки)
    .post("/trips/refresh", async () => {
      try {
        await TripsService.updateTrips(orionDb);
        const trips = await TripsService.getTrips(orionDb);

        return {
          success: true,
          message: "Trips data refreshed successfully",
          count: trips.length,
          lastUpdated: new Date().toISOString(),
        };
      } catch (error) {
        return {
          success: false,
          message: "Failed to refresh trips data",
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    })      
    .error(Errors)
    .onError(async ({ code, error, set, request, path }) => {
      const isProd = true
      // чтобы в логах не светились чувствительные данные
      const authorizationHeader = request.headers.get('authorization')
      if (authorizationHeader?.startsWith('Bearer ')) request.headers.set('authorization', 'Bearer ****')
      switch (code) {
        case 'Client': {
          set.status = 400
          console.error(
            `BadRequest: ${error.error_code}: ${error.error_message || ''} ${JSON.stringify({ ...error.params })};` +
              ` Req: ${request.method} ${request.url};` +
              ` Headers: ${JSON.stringify(request.headers)} <--\n`,
          )
          return { error_code: error.error_code, error_message: error.error_message, ...error.params }
        }
        case 'Unauthorized': {
          set.status = 401
          console.error(
            `Unauthorized: ${error.error_code}: ${error.error_message || ''};` +
              ` Req: ${request.method} ${request.url};` +
              ` Headers: ${JSON.stringify(request.headers)} <--\n`,
          )
          return { error_code: error.error_code, error_message: error.error_message }
        }
        case 'VALIDATION': {
          // в случае в VALIDATION ошибкой, error.message это JSON в виде строки. Причем с отступами и нормальным
          // форматированием - на клиенте можно нормально прочитать
          return isProd ? 'VALIDATION' : error.message
        }
        case 'NOT_FOUND': {
          const ignore404Errors = ['/ip']
          const isError404 = error instanceof NotFoundError
          const url = new URL(request.url)

          // Если на тестовом сервере возникла ошибка 404 из списка выше, то ничего не выводим в консоль
          const ignoreError = isError404 && !isProd && ignore404Errors.includes(url.pathname)
          if (!ignoreError) {
            console.warn(`${error.message}:404 ${request.method} ${request.url}`)
          }
          return isProd ? 'NOT_FOUND' : error.message
        }
        default: {
          console.error(error)

          return isProd ? 'INTERNAL_SERVER_ERROR' : error
        }
      }
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

    // Инициализируем данные при создании сервиса
    console.log("=== Initial trips update...");
    await TripsService.updateTrips(orionDb);

    // Настраиваем cron job для обновления каждую минуту
  const job = schedule.scheduleJob("*/5 * * * *", async function () {
    try {
      await TripsService.updateTrips(orionDb);
    } catch (error) {
      console.error("Cron job error:", error);
    }
  });

  const stop = async () => {
    // Останавливаем cron job в tripsService
    job.cancel();

    app.server?.stop(true);
    await app.stop();
    await tgBot.bot.stop();

    console.log("🛑 Application stopped");
  };

  return { app, stop };
};
export default {
  create,
};
