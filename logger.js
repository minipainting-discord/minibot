import { EmbedBuilder } from "discord.js"
import chalk from "chalk"

const COLORS = {
  info: "blue",
  warn: "yellow",
  error: "red",
  fatal: "magenta",
  moderation: "bgYellow",
}

const DISCORD_COLORS = {
  info: "#0098d9",
  warn: "#f6c42f",
  error: "#f52565",
  fatal: "#a05bb4",
  moderation: "#f59207",
}

export default function createLogger() {
  let bot = null

  async function botLog(level, scope, message, error) {
    if (!bot?.channels?.bot) {
      return
    }

    const description = `**[${scope}]** ${message}`
    const embed = new EmbedBuilder()
      .setColor(DISCORD_COLORS[level])
      .setDescription(
        error ? `${description}\n\`\`\`\n${error.stack}\`\`\`` : description
      )
    bot.channels.bot.send({ embeds: [embed] })

    if (["error", "fatal"].includes(level)) {
      bot.channels.bot.send(`<@${bot.settings.botMasterId}> :arrow_up:`)
    }
    if (level === "moderation") {
      bot.channels.bot.send(`${bot.roles.mod} :arrow_up:`)
    }
  }

  function format(level, scope, message) {
    return [
      chalk.gray(`[${new Date().toISOString().slice(0, -1)}]`),
      chalk[COLORS[level]](level),
      `[${scope}]`,
      message,
    ].join(" ")
  }

  const logger = {
    info(scope, message) {
      console.log(format("info", scope, message))
      botLog("info", scope, message)
    },

    warn(scope, message) {
      console.log(format("warn", scope, message))
      botLog("warn", scope, message)
    },

    error(scope, message, error) {
      console.error(format("error", scope, message), error)
      botLog("error", scope, message, error)
    },

    moderation(scope, message, error) {
      console.error(format("moderation", scope, message), error)
      botLog("moderation", scope, message, error)
    },

    fatal(scope, message, error) {
      console.error(format("fatal", scope, message), error)
      botLog("fatal", scope, message, error)
      console.trace()
      process.exit(1)
    },
  }

  return {
    ...logger,
    child: () => logger,
    setBot(_bot) {
      logger.info("core", "Online logging enabled")
      bot = _bot
    },
  }
}

export { DISCORD_COLORS }
