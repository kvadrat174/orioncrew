import { Elysia } from 'elysia'
import { node } from '@elysiajs/node'
import { telegramBotWebhook } from './tg/webhook'
import TelegramBot from './tg/TelegramBot'

const tgBot = TelegramBot.create()
const app = new Elysia({ adapter: node() })
	.use(telegramBotWebhook(
	tgBot.bot, config.telegram.webhookSecret,
	tgBotMirror && config.telegram2 && { tgBot: tgBotMirror.bot, webhookSecret: config.telegram2.webhookSecret }
  ))
	.get('/', () => 'Hello Elysia')
	.listen(3000, ({ hostname, port }) => {
		console.log(
			`🦊 Elysia is running at ${hostname}:${port}`
		)
	})