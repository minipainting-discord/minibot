import { Client, Collection, Intents } from "discord.js"

import { createSupabase } from "./supabase.js"
import { registerCommands } from "./commands/index.js"
import logger from "./logger.js"

const { DISCORD_API_TOKEN } = process.env
const BOT_INTENTS = [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES]

export function createBot() {
  const bot = {
    logger,
    channels: {},
    commands: new Collection(),
    db: createSupabase(),
    discord: new Client({ intents: BOT_INTENTS }),
    guild: null,
    roles: {},
    settings: null,
  }

  async function onReady() {
    bot.logger.info("🤖 Logged in to Discord")
    const { application } = bot.discord

    if (!application?.owner) {
      await application?.fetch()
    }

    bot.guild = bot.discord.guilds.cache.first()

    try {
      await registerNamedChannels(bot)
      await registerNamedRoles(bot)
      await registerCommands(bot)
    } catch (error) {
      bot.logger.fatal(error)
      process.exit(1)
    }

    bot.logger.info("🔥 I'm ready!")
  }

  async function onInteractionCreate(interaction) {
    const { commands } = bot

    if (interaction.isCommand() && commands.has(interaction.commandName)) {
      return commands.get(interaction.commandName).execute(interaction, bot)
    }

    return null
  }

  return {
    async start() {
      const { data: settings } = await bot.db.from("settings").select().single()
      bot.settings = settings

      bot.discord.on("interactionCreate", onInteractionCreate)
      bot.discord.once("ready", onReady)

      bot.discord.login(DISCORD_API_TOKEN)
    },
  }
}

async function registerNamedChannels(bot) {
  const { data: namedChannels } = await bot.db.from("namedChannels").select()

  for (const namedChannel of namedChannels) {
    const channel = await bot.guild.channels.fetch(namedChannel.channelId)
    bot.channels[namedChannel.shortName] = channel
  }
}

async function registerNamedRoles(bot) {
  const { data: namedRoles } = await bot.db.from("namedRoles").select()

  for (const namedRole of namedRoles) {
    const role = await bot.guild.roles.fetch(namedRole.roleId)
    bot.roles[namedRole.shortName] = role
  }
}
