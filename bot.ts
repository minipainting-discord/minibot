import { SupabaseClient } from "@supabase/supabase-js"
import Discord, {
  Collection,
  EmbedBuilder,
  Guild,
  GuildMember,
  Role,
  TextChannel,
} from "discord.js"
import { EventEmitter } from "node:events"

import { Database } from "./database.types"
import { DISCORD_COLORS, LogEvent, Logger } from "./logger"

import * as commands from "./commands"
import * as workflows from "./workflows"
import type { BotCommand } from "./commands"
import { Env } from "./env"
import { RankWithRole, getSortedRanks } from "./models/Rank"

export const AVAILABILITY = {
  PUBLIC: "public",
  MOD: "mod",
  ADMIN: "admin",
  BOT_MASTER: "bot-master",
} as const

type Availability = (typeof AVAILABILITY)[keyof typeof AVAILABILITY]

export const EVENT = {
  USER_POINTS_UPDATE: "player-score-update",
} as const

type InitializingBot = {
  EVENT: typeof EVENT
  AVAILABILITY: typeof AVAILABILITY
  discord: Discord.Client
  db: SupabaseClient<Database>
  env: Env
  logger: Logger
  channels: Record<string, TextChannel>
  commands: Collection<string, BotCommand>
  events: EventEmitter
  guild?: Guild
  ranks: Array<RankWithRole>
  roles: Record<string, Role>
  emojis: Record<string, Discord.GuildEmoji>
  isBotMaster: (guildMember: GuildMember) => boolean
  isAdmin: (guildMember: GuildMember) => boolean
  isModerator: (guildMember: GuildMember) => boolean
  onReady: () => Promise<void>
}

type Bot = Required<InitializingBot>

interface CreateBotDependencies {
  discord: Discord.Client
  db: SupabaseClient<Database>
  env: Env
  logger: Logger
}

export default function createBot({
  discord,
  db,
  env,
  logger,
}: CreateBotDependencies) {
  const bot: InitializingBot = {
    EVENT,
    AVAILABILITY,
    discord,
    db,
    env,
    logger,
    channels: {},
    commands: new Collection(),
    events: new EventEmitter(),
    guild: undefined,
    ranks: [],
    roles: {},
    emojis: {},

    isBotMaster(guildMember: GuildMember) {
      return guildMember.id === bot.env.BOT_MASTER_ID
    },
    isAdmin(guildMember: GuildMember) {
      return (
        bot.isBotMaster(guildMember) ||
        guildMember.roles.cache.has(bot.roles.admin.id)
      )
    },
    isModerator(guildMember: GuildMember) {
      return (
        bot.isAdmin(guildMember) ||
        guildMember.roles.cache.has(bot.roles.mod.id)
      )
    },

    async onReady() {
      bot.logger.info("core", "🤖 Logged in to Discord")

      bot.guild = bot.discord.guilds.cache.first()

      if (!isBotReady(bot)) {
        return bot.logger.fatal("core", "Unable to retrieve default guild")
      }

      try {
        await syncRanks(bot)
        await syncEmojis(bot)
        await registerNamedChannels(bot)
        await registerNamedRoles(bot)
        await registerCommands(bot)
        await registerWorkflows(bot)
      } catch (error) {
        bot.logger.fatal("core", "Startup failed", error as Error)
      }

      bot.logger.events.on("log", (logEvent: LogEvent) => log(bot, logEvent))

      bot.logger.info("core", "🔥 I'm ready!")
    },
  }

  return bot
}

function isBotReady(bot: InitializingBot): bot is Bot {
  return bot.guild !== undefined
}

async function log(bot: Bot, { level, scope, message, error }: LogEvent) {
  if (!bot.channels.bot) {
    return
  }

  const description = `**[${scope}]** ${message}`
  const embed = new EmbedBuilder()
    .setColor(DISCORD_COLORS[level])
    .setDescription(
      error ? `${description}\n\`\`\`\n${error.stack}\`\`\`` : description,
    )
  bot.channels.bot.send({ embeds: [embed] })

  if (["error", "fatal"].includes(level)) {
    bot.channels.bot.send(`<@${bot.env.BOT_MASTER_ID}> :arrow_up:`)
  }

  if (level === "warn") {
    // TODO: Find a better way to handle moderation pings
    bot.channels.bot.send(`${bot.roles.mod} :arrow_up:`)
  }
}

async function syncRanks(bot: Bot) {
  bot.logger.info("core", "Syncing ranks...")

  const allRoles = await bot.guild.roles.fetch()

  try {
    const ranks = await getSortedRanks(bot.db)
    bot.ranks = ranks.map((rank) => {
      const role = allRoles.get(rank.roleId)
      if (!role) {
        bot.logger.fatal(
          "core",
          `Unable to find matching role for rank ${rank.name}`,
        )
      }
      return RankWithRole(rank, role)
    })
  } catch (error) {
    bot.logger.fatal("core", "Unable to sync ranks", error)
  }
}

async function syncEmojis(bot: Bot) {
  bot.emojis = bot.guild.emojis.cache.reduce(
    (emojis, emoji) => ({ ...emojis, [emoji.name ?? emoji.identifier]: emoji }),
    {},
  )
}

async function registerNamedChannels(bot: Bot) {
  bot.logger.info("core", "Registering named channels...")
  const { data: namedChannels, error } = await bot.db
    .from("namedChannels")
    .select()

  if (!namedChannels?.length) {
    bot.logger.fatal("core", "No named channels found, aborting", error)
  }

  for (const namedChannel of namedChannels) {
    const channel = await bot.guild.channels.fetch(namedChannel.channelId)

    if (!channel) {
      bot.logger.fatal(
        "core",
        `Unable to fetch channel ${namedChannel.shortName}`,
      )
    }

    bot.channels[namedChannel.shortName] = channel as TextChannel
  }
}

async function registerNamedRoles(bot: Bot) {
  bot.logger.info("core", "Registering named roles...")

  const { data: namedRoles } = await bot.db.from("namedRoles").select()

  if (namedRoles === null) {
    return
  }

  for (const namedRole of namedRoles) {
    const role = await bot.guild.roles.fetch(namedRole.roleId)

    if (!role) {
      bot.logger.fatal("core", `Unable to fetch role ${namedRole.shortName}`)
    }

    bot.roles[namedRole.shortName] = role
  }
}

async function registerCommands(bot: Bot) {
  bot.logger.info("core", "Registering commands...")

  const commandBuilders = Object.values(commands)

  for (const buildCommand of commandBuilders) {
    try {
      const command = await Promise.resolve(buildCommand(bot)) // TODO: improve typing
      bot.commands.set(command.name, command)
    } catch (error) {
      bot.logger.fatal("core", buildCommand.name, error)
    }
  }

  bot.logger.info(
    "core",
    `Enabled commands: ${bot.commands.map((c) => c.name).join(", ")}`,
  )
}

async function registerWorkflows(bot: Bot) {
  bot.logger.info("core", "Registering workflows...")

  const workflowList = Object.values(workflows)

  for (const registerWorkflow of workflowList) {
    try {
      await registerWorkflow(bot)
    } catch (error) {
      bot.logger.fatal("core", registerWorkflow.name, error)
    }
  }

  bot.logger.info(
    "core",
    `Enabled workflows: ${workflowList
      .map((workflow) => workflow.name)
      .join(", ")}`,
  )
}

export type { Bot, Availability }
