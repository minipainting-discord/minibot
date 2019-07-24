const Discord = require("discord.js")
const sql = require("sqlite")
const shellwords = require("shellwords")
const filters = require("./filters")
const commands = require("./commands")
const settings = require("./settings.json")

const COMMAND_PREFIX = "!"

const bot = {
  db: null,
  client: null,
  settings,
  filters,
  commands,

  start() {
    const client = new Discord.Client()
    bot.client = client

    client.on("ready", bot.onReady)
    client.on("message", bot.onMessage)

    sql
      .open("./database.sqlite", { Promise })
      .then(database => {
        bot.db = database

        return Promise.all([
          bot.db.run(
            "CREATE TABLE IF NOT EXISTS scores (userId TEXT, points INTEGER, level INTEGER)",
          ),
          bot.db.run(
            "CREATE TABLE IF NOT EXISTS annual (userId TEXT, points INTEGER)",
          ),
        ])
      })
      .then(() => client.login(settings.token))
  },

  onDM(message) {
    const [firstWord, ...args] = splitMessage(message)

    for (const command of commands) {
      if (
        !command.availableInDM ||
        firstWord !== COMMAND_PREFIX + command.keyword
      ) {
        continue
      }

      bot.log(`DM <${message.author.username}> ${firstWord} ${args.join(" ")}`)
      command.execute(bot, message, ...args)
    }
  },

  onMessage(message) {
    // We are only interested in text messages from real users
    if (message.channel.type === "dm") {
      return bot.onDM(message)
    }
    if (message.author.bot || message.channel.type !== "text") {
      return
    }

    // First we apply each filter and we stop if the filter returns true
    for (const filter of filters) {
      if (filter(bot, message)) {
        break
      }
    }

    // If the message wasn't filtered out, we detect and execute commands
    const [firstWord, ...args] = splitMessage(message)
    const commandChannels = [settings.channels.botcoms, settings.channels.mod]

    for (const command of commands) {
      if (firstWord !== COMMAND_PREFIX + command.keyword) {
        continue
      }
      if (
        !commandChannels.includes(message.channel.id) ||
        (command.mod && message.channel.id !== settings.channels.mod)
      ) {
        continue
      }

      bot.log(
        `#${message.channel.name} <${
          message.author.username
        }> ${firstWord} ${args.join(" ")}`,
      )

      command.execute(bot, message, ...args)
      break
    }
  },

  onReady() {
    const guild = bot.client.guilds.first()

    bot.roles = Object.keys(settings.roles).reduce(
      (roles, key) => ({
        ...roles,
        [key]: guild.roles.find(role => role.name === settings.roles[key]),
      }),
      {},
    )

    bot.emojis = guild.emojis.reduce(
      (emojis, emoji) => ({ ...emojis, [emoji.name]: emoji }),
      {},
    )

    bot.log("I'm online!")
  },

  log(message, ...args) {
    console.log(`[${new Date().toISOString()}] ${message}`, ...args)
  },

  logError(error, message = "An error occured") {
    bot.log(`[ERROR] ${message}`, error)
  },
}

function splitMessage(message) {
  try {
    return shellwords.split(message.content)
  } catch (error) {
    return message.content.split(" ")
  }
}

bot.start()
