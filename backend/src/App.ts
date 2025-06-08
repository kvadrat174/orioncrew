import { Elysia } from "elysia";
import { node } from "@elysiajs/node";
import { telegramBotWebhook } from "./tg/webhook";
import TelegramBot from "./tg/TelegramBot";

const PORT = 3000;
const HOSTNAME = "localhost";

const create = async () => {
  const tgBot = await TelegramBot.create(process.env.BOT_TOKEN);
  const app = new Elysia({ adapter: node() })
    .use(telegramBotWebhook(tgBot.bot, process.env.BOT_TOKEN))
    .get("/", () => "Hello Elysia")
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
