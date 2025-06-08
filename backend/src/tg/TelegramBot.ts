import { Bot, Context, GrammyError, InlineKeyboard, session, SessionFlavor } from 'grammy'
import type { Update } from '@grammyjs/types/update'
import { getLang, getLangLabel, Lang } from './Lang'
import locale from './locale'
import { InlineKeyboardButton } from 'grammy/types'


export type TelegramBot = Awaited<ReturnType<typeof create>>
const create = async (token: string) => {
  const setWebhookAfterLaunch = false
  const bot = new Bot<MyContext>(token)
  const initial = (): SessionData => {
    return {
      lang: undefined,
      showLangBts: false,
    }
  }
  const canAuthenticate = (telegramId: string | number | undefined): boolean => {
    if (!telegramId) {
      return false
    }
    return true
  }

  bot.use(session({ initial }))
  console.debug('Wait question from TG...')
  if (setWebhookAfterLaunch) {
    const webhookInfo = await bot.api.getWebhookInfo()
    const allowed_updates: Exclude<keyof Update, 'update_id'>[] = [
      'message',
      'chat_member',
      'my_chat_member',
      'callback_query',
      'shipping_query',
      'inline_query',
      'business_message',
      'chat_join_request',
      'chosen_inline_result',
      'pre_checkout_query',
    ]
    // const isAlreadySet_webHookUrl = webhookInfo.url === tgConfig.webhookUrl
    // const isAlreadySet_allowedUpdaes = allowed_updates.every(update => webhookInfo.allowed_updates?.includes(update))
    // if (isAlreadySet_webHookUrl && isAlreadySet_allowedUpdaes) {
    //   log.warn(`Config setWebhookAfterLaunch === true but already set`, {
    //     isAlreadySet_webHookUrl,
    //     isAlreadySet_allowedUpdaes,
    //     webhookInfo,
    //   })
    // } else {
    //   log.info('Telegram setWebhook...')
    //   const setResult = await bot.api.setWebhook(tgConfig.webhookUrl, {
    //     secret_token: tgConfig.webhookSecret,
    //     allowed_updates: allowed_updates,
    //   })
    //   log.info(`Telegram setWebhook result: ${setResult}`)
    // }
  }

  const me = await bot.api.getMe().catch(e => {
    if (e instanceof GrammyError) {
      throw `TelegramBot did not start bot.api.getMe(). Check your env.TG_BOT_TOKEN. Error: ${e.message}`
    } else {
      throw e
    }
  })
  console.debug(`Bot is connected! Username = @${me.username}`)

  bot.command('lang', async ctx => {
    ctx.from?.language_code &&
      (await ctx.reply(`Client language: ${ctx.from.language_code}. \nSession language: ${ctx.session.lang || '-'}`))
  })

  bot.command('enable_lang_buttons', async ctx => {
    ctx.reply(`Enabled lang buttons ✅`).then(() => {
      ctx.session.showLangBts = true
    })
  })


  bot.command('disable_lang_buttons', async ctx => {
    ctx.reply(`Disabled lang buttons`).then(() => {
      ctx.session.showLangBts = false
    })
  })

  bot.command('start', async ctx => {
    if (!ctx.from) return

    const from = ctx.from
    const lang: Lang = ctx.session.lang || getLang(ctx.from.language_code)
    const fromLog = `[${ctx.from.id} ${ctx.from.first_name} ${ctx.from?.username}]`
    const __replyStart = replyStart(lang, ctx.from.first_name, !!ctx.session.showLangBts)
    const _replyStart = async () => {

      const pageId = 'Start'
      const params = () => ({ firstName: from.first_name })
      try {
        await ctx.api.sendPhoto(ctx.chat.id, __replyStart.body.photo, {
          caption: __replyStart.answer,
          parse_mode: __replyStart.body.parse_mode,
          reply_markup: __replyStart.body.reply_markup,
        })
        ctx.session.currentPage = { id: pageId, params: params }
        console.debug(`${fromLog} -> send msg: {{${pageId}}}`)
      } catch (error) {
        console.error('Error sending photo:', error)
        await ctx.reply(__replyStart.answer, __replyStart.body)
      }
    }
    _replyStart()
  })

  bot.on('message:text', async ctx => {
    if (!ctx.from || ctx.chat.type !== 'private') return
    ctx.reply(ctx.message.text)
  })

  bot.catch(console.error.bind(console))
  if (setWebhookAfterLaunch) {
    await bot.init()
    console.info('Webhook inited!')
  } else {
    // KS: Если не сделать вызов bot.init, то при вызове App.Stop() бот падает с ошибкой
    await bot.init()
    bot.start()
    console.info('Long pulling started!')
  }

  return { bot, me }
}

type PageId = 'Start' | 'HowToEarn' | 'Referral' | 'RefLink'
type PageParams<LC extends PageId, L extends Lang> = Parameters<(typeof locale)[LC][L]>[0]
type Page<_PageId extends PageId> = {
  id: PageId
  params: (lang: Lang) => PageParams<_PageId, typeof lang>
}
interface SessionData {
  lang?: Lang
  showLangBts?: boolean
  currentPage?: Page<PageId>
}
export type MyContext = Context & SessionFlavor<SessionData>

const btn = (
  lang: Lang,
  showLangBts: boolean,
): InlineKeyboard => {
  const Boost = {
    btn: InlineKeyboard.url('Записывайся на тренировки и гонки! 🔥', `https://t.me/orion_sailing_team_bot/orion_sail?startapp`),
  }
  return InlineKeyboard.from([[Boost.btn], langBtns(showLangBts, lang)])

}

const langBtns = (showLangBts: boolean, currentLang: Lang) =>
  showLangBts
    ? (Object.keys(locale.Start)
        .map(lang => (currentLang !== lang ? InlineKeyboard.text(getLangLabel(lang as Lang), lang) : undefined))
        .filter(_ => _) as InlineKeyboardButton.CallbackButton[])
    : []

const replyStart = (
  lang: Lang,
  firstName: string,
  showLangBts: boolean,
) => {
  const localeData = { firstName }
  return {
    answer: "Орион планирование",
    body: {
      parse_mode: 'Markdown' as const,
      reply_markup: btn(lang, showLangBts),
      photo: `https://www.google.com/url?sa=i&url=https%3A%2F%2Fdepositphotos.com%2Fru%2Fphotos%2F%25D1%258F%25D1%2585%25D1%2582%25D0%25B8%25D0%25BD%25D0%25B3.html&psig=AOvVaw1PZEOLlSSIQf7ES6knYUkR&ust=1749491780677000&source=images&cd=vfe&opi=89978449&ved=0CBIQjRxqFwoTCIDuoPOy4o0DFQAAAAAdAAAAABAg`
    },
  }
}

const escapeMarkdownV2 = (text: string) => {
  return text.replace(/([_*\[\]()~`>#+\-=|{}.!])/g, '\\$1')
}

const tgWebAppLink = (botName: string, webAppName: string) => `https://t.me/${botName}/${webAppName}`

export default { create, btn }
