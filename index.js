const Discord = require("discord.js")
const sql = require("sqlite")
const shellwords = require("shellwords")
const express = require("express")
const plugins = require("./plugins")
const settings = require("./settings.json")

const COMMAND_PREFIX = "!"

const commands = plugins.flatMap(p => p.commands || [])

console.log(plugins, commands)

const bot = {
  app: null,
  db: null,
  client: null,
  settings,
  plugins,
  commands,

  start() {
    const client = new Discord.Client()
    bot.client = client

    client.on("ready", bot.onReady)
    client.on("message", bot.onMessage)

    const app = express()
    plugins.filter(p => p.web).forEach(p => p.web(app, bot))
    app.set("view engine", "pug")
    app.use(express.static("public"))
    app.listen(4567, "0.0.0.0")

    bot.log(`Loaded commands: ${commands.map(c => c.keyword).join(", ")}`)
    bot.log(`Loaded plugins: ${plugins.map(p => p.name).join(", ")}`)

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
          bot.db.run(
            "CREATE TABLE IF NOT EXISTS log (userId TEXT, location TEXT, command TEXT, arguments TEXT, date TEXT DEFAULT CURRENT_TIMESTAMP)",
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
      bot.logCommand(message, command, args)
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
    for (const plugin of bot.plugins) {
      if (plugin.filter && plugin.filter(bot, message)) {
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
      bot.logCommand(message, command, args)
      break
    }
  },

  onReady() {
    const guild = bot.client.guilds.first()

    bot.client.user.setPresence({
      game: { name: "you", type: "WATCHING" },
    })

    bot.roles = Object.keys(settings.roles).reduce(
      (roles, key) => ({
        ...roles,
        [key]: guild.roles.find(role => role.name === settings.roles[key]),
      }),
      {},
    )

    bot.ranks = settings.ranks.map((rank, level) => ({
      ...rank,
      level: level + 1,
      role: guild.roles.find(r => r.name === rank.name),
    }))

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

  logCommand(message, command, args) {
    bot.db
      .run(
        "INSERT INTO log (userId, location, command, arguments) VALUES (?, ?, ?, ?)",
        [
          message.author.id,
          message.channel.id,
          command.keyword,
          JSON.stringify(args),
        ],
      )
      .catch(err => bot.logError(err, "Error while logging command"))
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
