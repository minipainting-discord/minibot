const Discord = require("discord.js")
const sqlite3 = require("sqlite3")
const sql = require("sqlite")
const shellwords = require("shellwords")
const express = require("express")
const utils = require("./utils")
const plugins = require("./plugins")
const settings = require("./settings.json")

const COMMAND_PREFIX = "!"

const commands = plugins.flatMap((p) => p.commands || [])

const bot = {
  app: null,
  db: null,
  data: new Map(),
  client: null,
  settings,
  plugins,
  commands,
  utils,

  async start() {
    const client = new Discord.Client()
    bot.client = client

    client.on("ready", bot.onReady)
    client.on("message", bot.onMessage)

    const app = express()
    plugins.forEach((p) => p.web && p.web(app, bot))
    app.set("view engine", "pug")
    app.use(express.static("public"))
    app.listen(4567, "0.0.0.0")

    bot.log(`Loaded commands: ${commands.map((c) => c.keyword).join(", ")}`)
    bot.log(`Loaded plugins: ${plugins.map((p) => p.name).join(", ")}`)

    try {
      bot.db = await sql.open({
        filename: "./database.sqlite",
        driver: sqlite3.Database,
      })

      await Promise.all(
        plugins.map(async (plugin) => {
          if (!plugin.setup) {
            return
          }
          bot.log(`Run setup for ${plugin.name}`)
          await plugin.setup(bot)
        }),
      )

      client.login(settings.token)
    } catch (error) {
      console.error("Bot startup failed")
      console.error(error)
      process.exit(1)
    }
  },

  async onDM(message) {
    const [firstWord, ...args] = splitMessage(message)

    // First we apply each dmFilter and we stop if the filter returns true
    for (const plugin of bot.plugins) {
      if (plugin.dmFilter && (await plugin.dmFilter(bot, message))) {
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

  async onMessage(message) {
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

    for (const command of commands) {
      if (firstWord !== COMMAND_PREFIX + command.keyword) {
        continue
      }

      if (!utils.isCommandAllowed(bot, command, message.channel.id)) {
        continue
      }

      bot.log(
        `#${message.channel.name} <${
          message.author.username
        }> ${firstWord} ${args.join(" ")}`,
      )

      try {
        await Promise.resolve(command.execute(bot, message, ...args))
        bot.logCommand(message, command, args)
      } catch (err) {
        bot.logError(err, `Error while executing ${command.keyword}`)
      }
      break
    }
  },

  async onReady() {
    const guild = bot.client.guilds.cache.first()

    bot.guild = guild

    bot.client.user.setPresence({
      game: { name: "you", type: "WATCHING" },
    })

    bot.channels = Object.keys(settings.channels).reduce(
      (channels, key) => ({
        ...channels,
        [key]: bot.client.channels.cache.get(settings.channels[key]),
      }),
      {},
    )

    bot.roles = Object.keys(settings.roles).reduce(
      (roles, key) => ({
        ...roles,
        [key]: guild.roles.cache.find(
          (role) => role.id === settings.roles[key],
        ),
      }),
      {},
    )

    bot.ranks = settings.ranks.map((rank, level) => ({
      ...rank,
      level: level + 1,
      role: guild.roles.cache.find((r) => r.name === rank.name),
    }))

    bot.emojis = guild.emojis.cache.reduce(
      (emojis, emoji) => ({ ...emojis, [emoji.name]: emoji }),
      {},
    )

    bot.log("I'm online!")

    for (const plugin of bot.plugins) {
      if (plugin.onReady) {
        await plugin.onReady(bot)
      }
    }
  },

  async findMember(id) {
    const fromGuildCache = bot.guild.members.cache.find((u) => u.id === id)

    return (
      fromGuildCache ??
      (await bot.db.get(
        "SELECT userId as id, displayName FROM users WHERE userId = ?",
        id,
      ))
    )
  },

  async fromModerator(message) {
    if (message.author.id === settings.botMaster) {
      return true
    }

    const guildMember =
      message.channel.type === "dm"
        ? await bot.findMember(message.author.id)
        : message.member

    if (!guildMember) {
      message.reply(`Who are you?`)
      return false
    }

    if (
      !guildMember.roles.cache.has(bot.roles.admin.id) &&
      !guildMember.roles.cache.has(bot.roles.mod.id)
    ) {
      message.reply(`Nope ${bot.emojis.LUL}`)
      return false
    }

    return true
  },

  log(message, ...args) {
    console.log(`[${new Date().toISOString()}] ${message}`, ...args)
  },

  logError(error, message = "An error occured", ...args) {
    console.error(
      `[ERROR] [${new Date().toISOString()}] ${message}\n`,
      error,
      ...args,
    )
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
      .catch((err) => bot.logError(err, "Error while logging command"))
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
