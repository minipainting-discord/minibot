import { start } from "repl"
import Discord from "discord.js"

import createLogger from "./logger.js"
import createSupabase from "./supabase.js"

const logger = createLogger()

const { DISCORD_API_TOKEN, SUPABASE_KEY, SUPABASE_URL } = process.env

const discord = new Discord.Client({
  intents: [
    Discord.Intents.FLAGS.GUILDS,
    Discord.Intents.FLAGS.GUILD_MESSAGES,
    Discord.Intents.FLAGS.GUILD_MEMBERS,
  ],
  partials: ["GUILD_MEMBER"],
})

const db = createSupabase({
  url: SUPABASE_URL,
  key: SUPABASE_KEY,
  logger,
})

const repl = start("> ")

await discord.login(DISCORD_API_TOKEN)
await discord.application.fetch()

repl.context.discord = discord
repl.context.guild = discord.guilds.cache.first()
repl.context.db = db

repl.on("exit", () => process.exit())
