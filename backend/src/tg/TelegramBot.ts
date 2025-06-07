import { Bot, Context, GrammyError, InlineKeyboard, session, SessionFlavor } from 'grammy'
import type { Update } from '@grammyjs/types/update'
import { getLang, Lang } from './Lang'
import locale from './locale'


export type TelegramBot = Awaited<ReturnType<typeof create>>
const create = async (arg: {
  tgConfig: Config['telegram']
  config: Config
  conf: Season2Config
  season2Db: Season2Db
  eventsSink: EventsSink
  clock: Clock
  authDb: AuthDb
}) => {
  const { authDb, tgConfig, season2Db, eventsSink, config, conf, clock } = arg
  const bot = new Bot<MyContext>(tgConfig.botToken)
  const initial = (): SessionData => {
    return {
      lang: undefined,
      showLangBts: tgConfig.enbaledLangBotButtons,
    }
  }
  const canAuthenticate = (telegramId: string | number | undefined): boolean => {
    if (!telegramId) {
      return false
    }
    return true
  }

  bot.use(session({ initial }))
  log.debug('Wait question from TG...')
  if (tgConfig.setWebhookAfterLaunch) {
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
    const isAlreadySet_webHookUrl = webhookInfo.url === tgConfig.webhookUrl
    const isAlreadySet_allowedUpdaes = allowed_updates.every(update => webhookInfo.allowed_updates?.includes(update))
    if (isAlreadySet_webHookUrl && isAlreadySet_allowedUpdaes) {
      log.warn(`Config setWebhookAfterLaunch === true but already set`, {
        isAlreadySet_webHookUrl,
        isAlreadySet_allowedUpdaes,
        webhookInfo,
      })
    } else {
      log.info('Telegram setWebhook...')
      const setResult = await bot.api.setWebhook(tgConfig.webhookUrl, {
        secret_token: tgConfig.webhookSecret,
        allowed_updates: allowed_updates,
      })
      log.info(`Telegram setWebhook result: ${setResult}`)
    }
  }

  const me = await bot.api.getMe().catch(e => {
    if (e instanceof GrammyError) {
      throw `TelegramBot did not start bot.api.getMe(). Check your env.TG_BOT_TOKEN. Error: ${e.message}`
    } else {
      throw e
    }
  })
  log.debug(`Bot is connected! Username = @${me.username}`)

  bot.command('lang', async ctx => {
    ctx.from?.language_code &&
      (await ctx.reply(`Client language: ${ctx.from.language_code}. \nSession language: ${ctx.session.lang || '-'}`))
  })

  bot.command('enable_lang_buttons', async ctx => {
    ctx.reply(`Enabled lang buttons ✅`).then(() => {
      ctx.session.showLangBts = true
    })
  })

  bot.command('get_webapp_links', async ctx => {
    const redirectProxy = 'https://wow.thememebox.io/redirect-localhost'
    ctx.reply(`👇 WebApp localhost links`, {
      reply_markup: InlineKeyboard.from([
        [
          InlineKeyboard.webApp(
            `Redirect to http://localhost:${config.httpPort}/public/playground2.html`,
            `${redirectProxy}/${config.httpPort}/public/playground2.html`,
          ),
        ],
        [InlineKeyboard.webApp(`Redirect to http://localhost:3000`, `${redirectProxy}/3000`)],
        canAuthenticate(ctx.from?.id) ? [InlineKeyboard.text('Authenticate', 'Auth')] : [],
      ]),
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
    const cbtUser = await season2Db.cbt_user.getOrUndef(ctx.from.id.toString())
    const __replyStart = replyStart(conf, lang, ctx.from.first_name, !!ctx.session.showLangBts, cbtUser)
    const now = clock.getNow()
    const _replyStart = async () => {
      await eventsSink.server.push({
        eventType: 'StartTgBotEvent',
        userId: from.id.toString(),
        createdAt: now,
      })
      const pageId = 'Start'
      const params = () => ({ firstName: from.first_name })
      try {
        await ctx.api.sendPhoto(ctx.chat.id, __replyStart.body.photo, {
          caption: __replyStart.answer,
          parse_mode: __replyStart.body.parse_mode,
          reply_markup: __replyStart.body.reply_markup,
        })
        ctx.session.currentPage = { id: pageId, params: params }
        log.debug(`${fromLog} -> send msg: {{${pageId}}}`)
      } catch (error) {
        log.error('Error sending photo:', error)
        await ctx.reply(__replyStart.answer, __replyStart.body)
      }
    }
    const payload = ctx.message?.text.split(' ')?.[1] // Получаем payload после команды /start
    if (!payload) return await _replyStart()
    const prefix = 'kentId'
    if (!payload.startsWith(prefix)) return await _replyStart()
    const referrerId = payload.substring(prefix.length)
    if (referrerId.length === 0) {
      log.error(`Not correct referral data. ${payload} ${fromLog}`)
      return await _replyStart()
    }

    const referrerAuthUser = await authDb.getAuthUserOrUndef(referrerId)
    if (!referrerAuthUser) {
      return await _replyStart()
    }

    const authUserId = ctx.from.id.toString()
    const user = await authDb.getAuthUserOrUndef(referrerId)
    const existing = await season2Db.getReferralOrUndef(referrerId, authUserId)

    if (user || existing) return await _replyStart()
    // const referral = await Logic.getUser(now, db, authUserId, {})
    // await season2Db.upsertAppData(user)
    const setReferrerCommand: Commands.SetReferrer = { type: 'SetReferrer', referrerId: referrerId }
    await season2Db.upsertDeferredUserCommand(authUserId, setReferrerCommand, now)

    const pageId = 'Referral'
    const params = () => ({
      firstName: from.first_name,
      referrerName: referrerAuthUser.name,
      welcomeBonus: getReferralSignUpBonus(conf),
    })
    const text = locale[pageId][lang](params())

    return await ctx
      .reply(text, {
        parse_mode: 'Markdown',
        link_preview_options: { is_disabled: true },
        reply_markup: btn(conf, lang, pageId, !!ctx.session.showLangBts, cbtUser),
      })
      .then(() => {
        ctx.session.currentPage = { id: pageId, params: params }
        log.debug(`${fromLog} -> send msg: {{${pageId}}}`)
      })
  })

  bot.on('callback_query', async ctx => {
    const localeCode = ctx.callbackQuery.data
    if (!localeCode) return undefined

    switch (localeCode) {
      case 'Auth': {
        if (!canAuthenticate(ctx.from.id)) {
          await ctx.reply('ERROR: Not implemented')
          await ctx.answerCallbackQuery()
          return
        }

        try {
          const tgUser = {
            id: ctx.from.id,
            isBot: false,
            firstName: ctx.from.first_name,
            lastName: ctx.from.last_name,
            username: ctx.from.username,
            languageCode: ctx.from.language_code,
            isPremium: ctx.from.is_premium,
          }

          const result = await signUp_andMerge<TelegramUser>({
            now: clock.getNow(),
            config,
            authDb,
            headers: {},
            telegramId: tgUser.id,
            accountId: tgUser.id.toString(),
            accountUserName: accountName_byTelegram(tgUser),
            createAccount: authUserId => ({ ...tgUser, authUserId }),
            getAccountOrUndef: id => authDb.tg_bot_user.getOrUndef(id),
            upsertAccount: user => authDb.tg_bot_user.upsert(user),
          })

          await ctx.reply('👇 Grab a new authorization token```\nBearer ' + result.authToken + '\n```', {
            parse_mode: 'Markdown',
          })
        } catch (e) {
          console.error(`Telegram auth error`, e)
          if (e && typeof e === 'object' && 'message' in e) {
            await ctx.reply(`ERROR: ${e.message}`)
          } else if (typeof e === 'string') {
            await ctx.reply(`ERROR: "${e}"`)
          }
        }
        await ctx.answerCallbackQuery()
        return
      }
      case 'HowToEarn': {
        const lang: Lang = ctx.session.lang || getLang(ctx.from.language_code)
        const params = (lang: Lang) => ({ guideLink: conf.guideLink[lang] || 'en' })
        const text = locale.HowToEarn[lang](params(lang))
        const fromLog = `[${ctx.from.id} ${ctx.from.first_name} ${ctx.from?.username}]`
        const cbtUser = await season2Db.cbt_user.getOrUndef(ctx.from.id.toString())
        return await ctx
          .reply(text, {
            parse_mode: 'Markdown',
            link_preview_options: { is_disabled: true },
            reply_markup: btn(conf, lang, localeCode, !!ctx.session.showLangBts, cbtUser),
          })
          .then(() => {
            ctx.session.currentPage = { id: localeCode, params: params }
            log.debug(`${fromLog} -> send msg: {{${localeCode}}}`)
          })
      }
      case 'ru':
      case 'latam':
      case 'vn':
      case 'br':
      case 'uz':
      case 'en': {
        const page = ctx.session.currentPage
        if (!page) return log.error('ctx.session.page is empty')
        const lang = localeCode
        ctx.session.lang = lang
        const answer = locale[page.id][lang](page.params(lang) as any) // <--- --- --- --- --- --- TODO any
        const cbtUser = await season2Db.cbt_user.getOrUndef(ctx.from.id.toString())
        return ctx.editMessageText(answer, {
          parse_mode: 'Markdown',
          link_preview_options: { is_disabled: true },
          reply_markup: btn(conf, lang, page.id, !!ctx.session.showLangBts, cbtUser),
        })
      }
    }
  })
  bot.on('chat_member', async ctx => {
    console.log(`chat_member! ${JSON.stringify(ctx)}`)
    if (!ctx.chatMember.new_chat_member) return
    const memberStatus = ctx.chatMember.new_chat_member.status
    const chatId = ctx.chatMember.chat.id
    const date = new Date(ctx.chatMember.date * 1000).toISOString()
    const userId = ctx.chatMember.new_chat_member.user.id
    await season2Db.upsertTgSubscriber({
      chatId: chatId,
      userId: userId,
      status: memberStatus,
      createdAt: date,
      updatedAt: date,
      needCheck: false,
    })
  })

  bot.on('message:text', async ctx => {
    if (!ctx.from || ctx.chat.type !== 'private') return
    const lang: Lang = ctx.session.lang || getLang(ctx.from.language_code)
    const fromLog = `[${ctx.from.id} ${ctx.from.first_name} ${ctx.from?.username}]`
    log.debug(`${fromLog} <- new msg: ${ctx.message.text}`)
    const pageId = 'Start'
    const pageParams = () => ({ firstName: ctx.from.first_name })
    const cbtUser = await season2Db.cbt_user.getOrUndef(ctx.from.id.toString())
    const _replyStart = replyStart(conf, lang, ctx.from.first_name, !!ctx.session.showLangBts, cbtUser)

    try {
      await ctx.api.sendPhoto(ctx.chat.id, _replyStart.body.photo, {
        caption: _replyStart.answer,
        parse_mode: _replyStart.body.parse_mode,
        reply_markup: _replyStart.body.reply_markup,
      })
      ctx.session.currentPage = { id: pageId, params: pageParams }
      log.debug(`${fromLog} -> send msg: {{${pageId}}}`)
    } catch (error) {
      log.error('Error sending photo:', error)
      await ctx.reply(_replyStart.answer, _replyStart.body)
    }
  })

  bot.catch(console.error.bind(console))

  if (tgConfig.webhookEnabled) {
    await bot.init()
    log.info('Webhook inited!')
  } else {
    // KS: Если не сделать вызов bot.init, то при вызове App.Stop() бот падает с ошибкой
    await bot.init()
    bot.start()
    log.info('Long pulling started!')
  }

  const sendReferralLink = (tgUser: TelegramUser, authUserId: string): Promise<Message.TextMessage> => {
    const lang = getLang(tgUser.languageCode)
    const pageId = 'RefLink'
    const botUsername = me.username
    const params = { refLink: `https://t.me/${botUsername}/${conf.tg.webAppName}?startapp=kentId${tgUser.id}` }
    return bot.api
      .sendMessage(tgUser.id, locale[pageId][lang](params), {
        reply_markup: RefLinkBtns(conf, lang, params.refLink),
      })
      .catch(e => {
        log.error(`sendReferralLink error: `, e, tgUser, tgUser.id)
        return Promise.reject(e)
      })
  }

  const isTgSubscriptionComplete = (tgSubscriber: TgSubscriber): boolean => {
    switch (tgSubscriber.status) {
      case 'creator':
      case 'administrator':
      case 'member':
      case 'restricted':
        return true
      case 'left':
      case 'kicked':
        return false
    }
    return false
  }

  const isMemberOfChannel = async (chatId: number, userId: number): Promise<boolean> => {
    const tgSubscriber = await season2Db.getTgSubscriber(chatId, userId).catch(async _ => {
      return await memberOfChannel(chatId, userId, true)
    })
    return isTgSubscriptionComplete(tgSubscriber)
  }

  const memberOfChannel = async (chatId: number, userId: number, isFake: boolean): Promise<TgSubscriber> => {
    if (isFake) {
      const date = new Date()
      const tgSubscriber = {
        chatId: chatId,
        userId: userId,
        status: 'member',
        createdAt: date.toISOString(),
        updatedAt: date.toISOString(),
        needCheck: true,
      }
      await season2Db.upsertTgSubscriber(tgSubscriber)
      return tgSubscriber
    }
    const chatMemberInfo = await bot.api.getChatMember(chatId, userId)
    const date = new Date()
    const tgSubscriber = {
      chatId: chatId,
      userId: userId,
      status: chatMemberInfo.status,
      createdAt: date.toISOString(),
      updatedAt: date.toISOString(),
      needCheck: false,
    }
    await season2Db.upsertTgSubscriber(tgSubscriber)
    return tgSubscriber
  }

  return { bot, me, sendReferralLink, memberOfChannel, isMemberOfChannel }
}

const log = new Logger({
  name: 'TgBot',
  hideLogPositionForProduction: true,
  prettyLogTemplate: '{{name}} ',
})

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

const isCbtMode = (cbtUser: CbtUser): boolean =>
  Boolean(cbtUser.fightClubAccess || cbtUser.gameDevAccess || cbtUser.kingAccess)

const btn = (
  conf: Season2Config,
  lang: Lang,
  pageId: PageId,
  showLangBts: boolean,
  cbtUser: CbtUser | undefined,
): InlineKeyboard => {
  const Boost = {
    btn: InlineKeyboard.url('Hamster Boost - Выиграй TON! 🔥', `https://t.me/${conf.boostBotName}`),
  }
  const Verse = {
    btn: InlineKeyboard.url('🐹 HamsterVerse 🐹', tgWebAppLink(conf.verseBotName, conf.verseWebAppName)),
    subscribe: InlineKeyboard.url(locale.Btn_Subscribe[lang], conf.subscribeChannelUrl),
  }
  const GameDev = {
    btn: InlineKeyboard.webApp('Играть в Hamster Gamedev 🎮', conf.season2WebAppUrl),
    subscribe: InlineKeyboard.url('Подписаться на наш канал 📢', 'https://t.me/hamster_kombat_gd'),
  }
  const FightClub = {
    btn: InlineKeyboard.url('Hamster Fight Club (CBT)', 'https://t.me/hamster_fightclub_bot'),
    subscribe: InlineKeyboard.url('Subscribe to Hamster Fight Club channel', 'https://t.me/hk_fight_club'),
  }
  const King = {
    btn: InlineKeyboard.url('Hamster King (CBT)', 'https://t.me/hamsterking_game_bot'),
    subscribe: InlineKeyboard.url('Subscribe to Hamster King channel', 'https://t.me/hamsterking_game'),
  }
  switch (pageId) {
    case 'Start': {
      return cbtUser && isCbtMode(cbtUser)
        ? InlineKeyboard.from([[GameDev.btn], [GameDev.subscribe], [Boost.btn], langBtns(showLangBts, lang)])
        : InlineKeyboard.from([[GameDev.btn], [GameDev.subscribe], [Boost.btn], langBtns(showLangBts, lang)])
    }
    case 'Referral': {
      return InlineKeyboard.from([
        [GameDev.btn],
        [GameDev.subscribe],
        [Verse.btn],
        [Boost.btn],
        [Verse.subscribe],
        langBtns(showLangBts, lang),
      ])
    }
    case 'HowToEarn': {
      return InlineKeyboard.from([
        [GameDev.btn],
        [GameDev.subscribe],
        [Verse.btn],
        [Boost.btn],
        [Verse.subscribe],
        langBtns(showLangBts, lang),
      ])
    }
    case 'RefLink': {
      return RefLinkBtns(conf, lang, '')
    }
  }
}

const RefLinkBtns = (conf: Season2Config, lang: Lang, refLink: string) => {
  const text = `Play with me, become cryptoexchange CEO and get a token airdrop!
💸 +2k Coins as a first-time gift
🔥 +25k Coins if you have  Telegram Premium`
  const link = `https://t.me/share/url?text=${encodeURIComponent(text)}&url=${encodeURIComponent(refLink)}`
  return InlineKeyboard.from([
    [InlineKeyboard.url(locale.Btn_InviteFriends[lang], link)],
    [InlineKeyboard.webApp(locale.Btn_BackToGame[lang], conf.season2WebAppUrl)],
  ])
}

const langBtns = (showLangBts: boolean, currentLang: Lang) =>
  showLangBts
    ? (Object.keys(locale.Start)
        .map(lang => (currentLang !== lang ? InlineKeyboard.text(getLangLabel(lang as Lang), lang) : undefined))
        .filter(_ => _) as InlineKeyboardButton.CallbackButton[])
    : []

const replyStart = (
  conf: Season2Config,
  lang: Lang,
  firstName: string,
  showLangBts: boolean,
  cbtUser: CbtUser | undefined,
) => {
  const localeData = { firstName }
  const answer = cbtUser && isCbtMode(cbtUser) ? locale.StartCbt[lang](localeData) : locale.Start[lang](localeData)
  return {
    answer,
    body: {
      parse_mode: 'Markdown' as const,
      reply_markup: btn(conf, lang, 'Start', showLangBts, cbtUser),
      photo: `${conf.cdn.baseUrl}/${conf.cdn.welcomeImage}`,
    },
  }
}

const escapeMarkdownV2 = (text: string) => {
  return text.replace(/([_*\[\]()~`>#+\-=|{}.!])/g, '\\$1')
}

const tgWebAppLink = (botName: string, webAppName: string) => `https://t.me/${botName}/${webAppName}`

export default { create, btn, RefLinkBtns }
