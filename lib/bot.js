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
      await syncRanks(bot)
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
      try {
        return await commands
          .get(interaction.commandName)
          .execute(interaction, bot)
      } catch (error) {
        bot.logger.error(`Error while executing ${error.commandName}`, error)
      }
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

async function syncRanks(bot) {
  // TODO: The synchronization logic is very basic, it should be a bit smarter
  // and ran at frequent intervals
  const { data: ranks } = await bot.db.from("ranks").select()

  const allRoles = await bot.guild.roles.fetch()

  for (const rank of ranks) {
    if (rank.roleId) {
      continue
    }

    // roleId is missing, try to fetch the rank by name or warn about it being missing
    if (!rank.roleId) {
      const existingRole = allRoles.find((role) => role.name === rank.name)

      if (existingRole) {
        await bot.db
          .from("ranks")
          .update({ roleId: existingRole.id })
          .eq("id", rank.id)
        bot.logger.info(`Matched rank ${rank.name} to role ${existingRole.id}`)
      } else {
        bot.logger.warn(`Missing role for rank ${rank.name}`)
      }
    }
  }
}
