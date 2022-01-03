import { Collection } from "discord.js"
import EventEmitter from "events"

import { importDirectory } from "./utils.js"

const AVAILABILITY = {
  PUBLIC: "public",
  MOD: "mod",
  ADMIN: "admin",
}

const EVENT = {
  PLAYER_SCORE_UPDATE: "player-score-update",
}

export default function createBot({ discord, db, logger }) {
  const bot = {
    EVENT,
    AVAILABILITY,
    discord,
    db,
    logger,
    channels: {},
    commands: new Collection(),
    events: new EventEmitter(),
    guild: null,
    ranks: [],
    roles: {},
    settings: null,
    isBotMaster,
    isAdmin,
    isModerator,
  }

  async function onReady() {
    bot.logger.info("core", "🤖 Logged in to Discord")
    const { application } = bot.discord

    if (!application?.owner) {
      await application?.fetch()
    }

    bot.guild = bot.discord.guilds.cache.first()

    try {
      await syncRanks(bot)
      await syncEmojis(bot)
      await registerNamedChannels(bot)
      await registerNamedRoles(bot)
      await registerCommands(bot)
      await registerWorkflows(bot)
    } catch (error) {
      bot.logger.fatal("core", error)
    }

    bot.logger.info("core", "🔥 I'm ready!")
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
    return isAdmin(guildMember) || guildMember.roles.cache.has(bot.roles.mod.id)
  }

  return {
    async setup() {
      const { data: settings } = await db.from("settings").select().single()
      bot.settings = settings

      discord.once("ready", onReady)
    },
  }
}

async function syncRanks(bot) {
  bot.logger.info("core", "Syncing ranks...")
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
        bot.logger.warn("core", `Missing role for rank ${rank.name}`)
        continue
      }

      await bot.db
        .from("ranks")
        .update({ roleId: existingRole.id })
        .eq("id", rank.id)

      rank.role = existingRole

      bot.logger.info(
        "core",
        `Matched rank ${rank.name} to role ${existingRole.id}`
      )
    }
  }

  bot.ranks = ranks
}

async function syncEmojis(bot) {
  bot.emojis = bot.guild.emojis.cache.reduce(
    (emojis, emoji) => ({ ...emojis, [emoji.name]: emoji }),
    {}
  )
}

async function registerNamedChannels(bot) {
  bot.logger.info("core", "Registering named channels...")
  const { data: namedChannels } = await bot.db.from("namedChannels").select()

  for (const namedChannel of namedChannels) {
    const channel = await bot.guild.channels.fetch(namedChannel.channelId)
    bot.channels[namedChannel.shortName] = channel
  }
}

async function registerNamedRoles(bot) {
  bot.logger.info("core", "Registering named roles...")
  const { data: namedRoles } = await bot.db.from("namedRoles").select()

  for (const namedRole of namedRoles) {
    const role = await bot.guild.roles.fetch(namedRole.roleId)
    bot.roles[namedRole.shortName] = role
  }
}

async function registerCommands(bot) {
  bot.logger.info("core", "Registering commands...")

  const commandList = await importDirectory("commands", bot.logger)

  for (const registerCommand of commandList) {
    try {
      const command = await registerCommand(bot)
      bot.commands.set(command.name, command)
    } catch (error) {
      bot.logger.fatal("core", registerCommand.name, error)
    }
  }

  bot.logger.info(
    "core",
    `Enabled commands: ${commandList.map((c) => c.name).join(", ")}`
  )
}

async function registerWorkflows(bot) {
  const workflowList = await importDirectory("workflows", bot.logger)

  for (const registerWorkflow of workflowList) {
    try {
      await registerWorkflow(bot)
    } catch (error) {
      bot.logger.fatal("core", registerWorkflow.name, error)
    }
  }
  bot.logger.info(
    "core",
    `Registered workflows: ${workflowList
      .map((workflow) => workflow.name)
      .join(", ")}`
  )
}
