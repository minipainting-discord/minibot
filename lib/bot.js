import { Client, Collection, Intents } from "discord.js"

import { registerCommands } from "./commands/index.js"
import logger from "./logger.js"

const { DISCORD_API_TOKEN } = process.env
const BOT_INTENTS = [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES]

export function createBot() {
  const bot = {
    logger,
    commands: new Collection(),
    discord: new Client({ intents: BOT_INTENTS }),
    guild: null,
  }

  async function onReady() {
    const { application } = bot.discord

    if (!application?.owner) {
      await application?.fetch()
    }

    bot.guild = bot.discord.guilds.cache.first()

    try {
      await registerCommands(bot)
    } catch (error) {
      bot.logger.fatal(error)
      process.exit(1)
    }

    bot.logger.info("🤖 I'm ready!")
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
      bot.discord.on("interactionCreate", onInteractionCreate)
      bot.discord.once("ready", onReady)

      bot.discord.login(DISCORD_API_TOKEN)
    },
  }
}
