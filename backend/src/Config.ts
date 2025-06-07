import { t, TSchema, Static } from "elysia"
import { Value } from '@sinclair/typebox/value'
import { SchemaOptions } from '@sinclair/typebox/type'


// ❗️TODO если нужны не строковые значения в конфге, то нужно использовать getEnvJSON вместо getEnv
export type Config = ReturnType<typeof Config>
export const Config = () =>
  ({
    httpPort: getEnvJSON("HTTP_PORT", PosInteger({ default: 8088 })),
    jwt_secret_key: getEnv("JWT_SECRET_KEY",t.String({ default: "Secret_key" })),
    corsCacheMaxAge: getEnvJSON("CORS_CACHE_MAX_AGE", PosInteger({ default: 5 })),
    telegram: {
      enbaledLangBotButtons: getEnvJSON("TG_BOT_LANG_BUTTONS_ENABLED", t.MaybeEmpty(t.Boolean())),
      botToken: getEnv("TG_BOT_TOKEN", t.String()),
      webhookEnabled: getEnvJSON("TG_BOT_WEBHOOK_ENABLED", t.Boolean()),
      webhookSecret: getEnv("TG_BOT_WEBHOOK_SECRET", t.String()),
      webhookUrl: getEnv("TG_BOT_WEBHOOK_URL", URI()),
      setWebhookAfterLaunch: getEnvJSON("TG_BOT_SET_WEBHOOK_AFTER_LAUNCH", t.Boolean()),
    }
  })


// базовое представление уровней логирования, такие уровни должны быть везде
// если будет необходимость можно расширить
export const LogLevel = (opts?: SchemaOptions) => t.Union([
  t.Literal("ERROR"),
  t.Literal("WARN"),
  t.Literal("INFO"),
  t.Literal("DEBUG"),
], opts)
export type LogLevel = Static<ReturnType<typeof LogLevel>>

const getEnvRaw = (key: string): string | undefined =>
  process.env[key]

export const getEnv = <T extends TSchema>(key: string, type: T) => {
  const value = getEnvRaw(key)
  try {
    return Value.Encode(type, Value.Default(type, value))
  } catch (e) {
   throw `Config env ${key} must be ${JSON.stringify(type)}, but got '${value}'`
  }
}

const getEnvJSON = <T extends TSchema>(key: string, type: T) => {
  const stringValue = getEnvRaw(key)
  try {
    const value = stringValue ? JSON.parse(stringValue) : undefined
    return Value.Decode(type, Value.Default(type, value))
  } catch (e) {
   throw `Config env ${key} must be ${JSON.stringify(type)}, but got '${stringValue}'`
  }
}
