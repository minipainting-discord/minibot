import Discord from "discord.js"

import createLogger from "./logger.js"
import createBot from "./bot.js"
import createSupabase from "./supabase.js"

const logger = createLogger()

const requiredVariables = ["DISCORD_API_TOKEN", "SUPABASE_KEY", "SUPABASE_URL"]
const missing = requiredVariables.filter((variable) => !process.env[variable])

if (missing.length) {
  const s = missing.length > 1 ? "s" : ""
  logger.fatal(`Missing environment variable${s}: ${missing.join(", ")}`)
}

const { DISCORD_API_TOKEN, SUPABASE_KEY, SUPABASE_URL } = process.env

const discord = new Discord.Client({
  intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES],
})

const db = createSupabase({
  url: SUPABASE_URL,
  key: SUPABASE_KEY,
  logger,
})

const bot = createBot({
  discord,
  db,
  logger,
})

await bot.setup()
await discord.login(DISCORD_API_TOKEN)
