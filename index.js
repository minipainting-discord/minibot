const Discord = require("discord.js")
const sql = require("sqlite")
const shellwords = require("shellwords")
const express = require("express")
const utils = require("./utils")
const plugins = require("./plugins")
const settings = require("./settings.json")

const COMMAND_PREFIX = "!"

const commands = plugins.flatMap(p => p.commands || [])

const bot = {
  app: null,
  db: null,
  data: new Map(),
  client: null,
  settings,
  plugins,
  commands,
  utils,

  start() {
    const client = new Discord.Client()
    bot.client = client

    client.on("ready", bot.onReady)
    client.on("message", bot.onMessage)

    const app = express()
    plugins.forEach(p => p.web && p.web(app, bot))
    app.set("view engine", "pug")
    app.use(express.static("public"))
    app.listen(4567, "0.0.0.0")

    bot.log(`Loaded commands: ${commands.map(c => c.keyword).join(", ")}`)
    bot.log(`Loaded plugins: ${plugins.map(p => p.name).join(", ")}`)

    sql
      .open("./database.sqlite")
      .then(database => {
        bot.db = database

        return Promise.all(
          plugins
            .filter(p => p.setup)
            .map(async plugin => {
              bot.log(`Run setup for ${plugin.name}`)
              await plugin.setup(bot)
            }),
        )
      })
      .then(() => client.login(settings.token))
      .catch(err => {
        console.error("Bot startup failed")
        console.error(err)
      })
  },

  onDM(message) {
    const [firstWord, ...args] = splitMessage(message)

    // First we apply each dmFilter and we stop if the filter returns true
    for (const plugin of bot.plugins) {
      if (plugin.dmFilter && plugin.dmFilter(bot, message)) {
        break
      }
    }

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
    // Ignore the bot's own messages
    if (message.author === bot.client.user) {
      return
    }

    // Handle DM messages separately
    if (message.channel.type === "dm") {
      return bot.onDM(message)
    }

    // We are only interested in text messages from real users
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
    const commandChannels = [
      settings.channels.botcoms,
      settings.channels.mod,
      settings.channels.vc,
    ]

    for (const command of commands) {
      if (firstWord !== COMMAND_PREFIX + command.keyword) {
        continue
      }
      if (
        !(command.anywhere || commandChannels.includes(message.channel.id)) ||
        (command.mod && message.channel.id !== settings.channels.mod) ||
        (!command.vc && message.channel.id === settings.channels.vc)
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

    // Prefetch members
    guild.fetchMembers()

    bot.guild = guild

    bot.client.user.setPresence({
      game: { name: "you", type: "WATCHING" },
    })

    bot.channels = Object.keys(settings.channels).reduce(
      (channels, key) => ({
        ...channels,
        [key]: bot.client.channels.get(settings.channels[key]),
      }),
      {},
    )

    bot.roles = Object.keys(settings.roles).reduce(
      (roles, key) => ({
        ...roles,
        [key]: guild.roles.find(role => role.id === settings.roles[key]),
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

  findMember(id) {
    return bot.guild.members.find(u => u.id === id)
  },

  fromModerator(message) {
    const guildMember =
      message.channel.type === "dm"
        ? bot.findMember(message.author.id)
        : message.member

    if (!guildMember) {
      message.reply(`Who are you?`)
      return false
    }

    if (
      !guildMember.roles.has(bot.roles.admin.id) &&
      !guildMember.roles.has(bot.roles.mod.id)
    ) {
      message.reply(`Nope ${bot.emojis.LUL}`)
      return false
    }

    return true
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
