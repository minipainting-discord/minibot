import { createLogger } from "./logger"
import createBot from "./bot"
import { createSupabase } from "./supabase"
import { createEnv } from "./env"
import { createDiscordClient } from "./discord"

const logger = createLogger()
const env = createEnv(process.env, logger)
const discord = createDiscordClient()
const db = createSupabase({
  url: env.SUPABASE_URL,
  key: env.SUPABASE_KEY,
  logger,
})

const bot = createBot({
  env,
  discord,
  db,
  logger,
})

discord.once("ready", bot.onReady)
await discord.login(env.DISCORD_API_TOKEN)
