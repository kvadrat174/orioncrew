import { Elysia } from "elysia";
import { node } from "@elysiajs/node";
import { telegramBotWebhook } from "./tg/webhook";
import TelegramBot from "./tg/TelegramBot";

const PORT = 3500;
const HOSTNAME = "0.0.0.0";

interface CrewMember {
    id: number;
    name: string;
    position: string;
    phone?: string;
    experience: string;
  }
interface SeaTrip {
    date: string;
    crew: CrewMember[];
    vessel: string;
    departure: string;
    estimatedReturn: string;
    destination: string;
    status: "planned" | "active" | "completed";
  }

  const mockData: SeaTrip[] = [
    {
      date: "2025-06-08",
      vessel: "Морской Волк",
      departure: "06:00",
      estimatedReturn: "18:00",
      destination: "Северная банка",
      status: "planned",
      crew: [
        {
          id: 1,
          name: "Иван Петров",
          position: "Капитан",
          phone: "+7-911-123-45-67",
          experience: "15 лет",
        },
        {
          id: 2,
          name: "Алексей Морозов",
          position: "Помощник капитана",
          phone: "+7-911-234-56-78",
          experience: "8 лет",
        },
        {
          id: 3,
          name: "Сергей Волков",
          position: "Механик",
          phone: "+7-911-345-67-89",
          experience: "12 лет",
        },
        {
          id: 4,
          name: "Дмитрий Белов",
          position: "Рыбак",
          experience: "5 лет",
        },
      ],
    },
    {
      date: "2025-06-10",
      vessel: "Удача",
      departure: "05:30",
      estimatedReturn: "19:00",
      destination: "Восточная зона",
      status: "planned",
      crew: [
        {
          id: 5,
          name: "Николай Козлов",
          position: "Капитан",
          phone: "+7-911-456-78-90",
          experience: "20 лет",
        },
        {
          id: 6,
          name: "Андрей Рыбин",
          position: "Боцман",
          phone: "+7-911-567-89-01",
          experience: "10 лет",
        },
        {
          id: 7,
          name: "Михаил Морской",
          position: "Рыбак",
          experience: "7 лет",
        },
        {
          id: 8,
          name: "Олег Штормов",
          position: "Рыбак",
          experience: "3 года",
        },
      ],
    },
    {
      date: "2025-06-12",
      vessel: "Нептун",
      departure: "07:00",
      estimatedReturn: "17:30",
      destination: "Южная акватория",
      status: "planned",
      crew: [
        {
          id: 9,
          name: "Владимир Океанов",
          position: "Капитан",
          phone: "+7-911-678-90-12",
          experience: "18 лет",
        },
        {
          id: 10,
          name: "Евгений Приливов",
          position: "Механик",
          phone: "+7-911-789-01-23",
          experience: "14 лет",
        },
        {
          id: 11,
          name: "Артем Глубинов",
          position: "Рыбак",
          experience: "6 лет",
        },
      ],
    },
  ];

const create = async () => {
  const tgBot = await TelegramBot.create(process.env.BOT_TOKEN);
  const app = new Elysia({ adapter: node() })
    .use(telegramBotWebhook(tgBot.bot, process.env.BOT_TOKEN))
    .get("/trips", () => mockData)
    .listen(PORT, ({ hostname, port }) => {
      console.log(`🦊 Elysia is running at ${HOSTNAME}:${port}`);
    });
  console.log(`
    🦊 Elysia is running at http://${HOSTNAME}:${PORT}/public/playground2.html
    Swagger at http://${HOSTNAME}:${PORT}/swagger-super-secret-path
    Open Telegram WebApp at https://t.me/${tgBot.me.username} (send command /get_webapp_links)
        `);
  const stop = async () => {
    app.server?.stop(true);
    await app.stop();
    await tgBot.bot.stop();
  };

  return { app, stop };
};

export type App = Awaited<ReturnType<typeof create>>["app"];
export default {
  create,
};
