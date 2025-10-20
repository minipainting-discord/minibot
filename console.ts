import { start } from "repl"
import Discord, { GatewayIntentBits, Partials } from "discord.js"

import { createLogger } from "./logger"
import { createSupabase } from "./supabase"
import { createEnv } from "./env"

const logger = createLogger()
const env = createEnv(process.env, logger)

const discord = new Discord.Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.GuildMember],
})

const db = createSupabase({
  url: env.SUPABASE_URL,
  key: env.SUPABASE_KEY,
  logger,
})

const repl = start("> ")

await discord.login(env.DISCORD_API_TOKEN)

repl.context.discord = discord
repl.context.guild = discord.guilds.cache.first()
repl.context.db = db

repl.on("exit", () => process.exit())
