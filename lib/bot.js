import EventEmitter from "events"
import { Client, Collection, Intents } from "discord.js"

import { createSupabase } from "./supabase.js"
import { registerCommands } from "./commands/index.js"
import { registerEvents } from "./events/index.js"
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
    events: new EventEmitter(),
    guild: null,
    ranks: [],
    roles: {},
    settings: null,
    isBotMaster,
    isAdmin,
    isModerator,
    PermissionError,
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
      await registerEvents(bot)
    } catch (error) {
      bot.logger.fatal(error)
    }

    bot.logger.info("🔥 I'm ready!")
  }

  function isBotMaster(guildMember) {
    return guildMember.id === bot.settings.botMasterId
  }

  function isAdmin(guildMember) {
    return (
      isBotMaster(guildMember) ||
      guildMember.roles.cache.has(bot.roles.admin.id)
    )
  }

  function isModerator(guildMember) {
    return (
      isBotMaster(guildMember) ||
      [bot.roles.admin, bot.roles.mod].some((role) =>
        guildMember.roles.cache.has(role.id)
      )
    )
  }

  return {
    async start() {
      const { data: settings } = await bot.db.from("settings").select().single()
      bot.settings = settings

      bot.discord.once("ready", onReady)

      bot.discord.login(DISCORD_API_TOKEN)
    },
  }
}

async function registerNamedChannels(bot) {
  bot.logger.info("Registering named channels...")
  const { data: namedChannels } = await bot.db.from("namedChannels").select()

  for (const namedChannel of namedChannels) {
    const channel = await bot.guild.channels.fetch(namedChannel.channelId)
    bot.channels[namedChannel.shortName] = channel
  }
}

async function registerNamedRoles(bot) {
  bot.logger.info("Registering named roles...")
  const { data: namedRoles } = await bot.db.from("namedRoles").select()

  for (const namedRole of namedRoles) {
    const role = await bot.guild.roles.fetch(namedRole.roleId)
    bot.roles[namedRole.shortName] = role
  }
}

async function syncRanks(bot) {
  bot.logger.info("Syncing ranks...")
  // TODO: The synchronization logic is very basic, it should be a bit smarter
  // and ran at frequent intervals
  const { data: ranks } = await bot.db
    .from("ranks")
    .select()
    .order("minPoints", { ascending: true })

  const allRoles = await bot.guild.roles.fetch()

  for (const rank of ranks) {
    if (rank.roleId) {
      rank.role = await bot.guild.roles.fetch(rank.roleId)
      continue
    }

    // roleId is missing, try to fetch the rank by name or warn about it being missing
    if (!rank.roleId) {
      const existingRole = allRoles.find((role) => role.name === rank.name)

      if (!existingRole) {
        bot.logger.warn(`Missing role for rank ${rank.name}`)
        continue
      }

      await bot.db
        .from("ranks")
        .update({ roleId: existingRole.id })
        .eq("id", rank.id)

      rank.role = existingRole

      bot.logger.info(`Matched rank ${rank.name} to role ${existingRole.id}`)
    }
  }

  bot.ranks = ranks
}

class PermissionError extends Error {}
