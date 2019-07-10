const Discord = require("discord.js")
const sql = require("sqlite")
const shellwords = require("shellwords")
const filters = require("./filters")
const commands = require("./commands")
const settings = require("./settings.json")

const COMMAND_PREFIX = "!"

const bot = {
  db: {
    score: null,
    accounts: null,
  },
  client: null,
  filters,
  commands,

  onMessage: message => {
    // We are only interested in text messages from real users
    if (message.author.bot) return
    if (message.channel.type !== "text") return

    // First we apply each filter and we stop if the filter returns true
    for (const filter of filters) {
      if (filter(bot, message)) {
        break
      }
    }

    // If the message wasn't filtered out, we detect and execute commands
    const firstWord = message.content.split(" ")[0]

    function splitMessage(message) {
      try {
        return shellwords.split(message.cleanContent)
      } catch (error) {
        return message.cleanContent.split(" ")
      }
    }

    for (const command of commands) {
      if (firstWord === COMMAND_PREFIX + command.keyword) {
        const [keyword, ...args] = splitMessage(message)
        const commandChannels = [
          settings.channels.botcoms,
          settings.channels.mod,
        ]

        if (!commandChannels.includes(message.channel.id)) {
          break
        }

        if (command.mod && message.channel.id !== settings.channels.mod) {
          break
        }

        bot.log(
          `#${message.channel.name} <${
            message.author.username
          }> ${keyword} ${args.join(" ")}`,
        )
        command.execute(bot, message, ...args)

        break
      }
    }
  },

  onReady: () => {
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

const client = new Discord.Client()
bot.client = client

client.on("ready", bot.onReady)
client.on("message", bot.onMessage)

Promise.all([
  sql.open("./score.sqlite", { Promise }),
  sql.open("./accounts.sqlite", { Promise }),
])
  .then(function([scoreDB, accountsDB]) {
    bot.db.score = scoreDB
    bot.db.accounts = accountsDB

    return Promise.all([
      bot.db.score.run(
        "CREATE TABLE IF NOT EXISTS scores (userId TEXT, points INTEGER, level INTEGER)",
      ),
      bot.db.score.run(
        "CREATE TABLE IF NOT EXISTS annual (userId TEXT, points INTEGER)",
      ),
      bot.db.accounts.run(
        "CREATE TABLE IF NOT EXISTS accounts (userId TEXT, account TEXT, album TEXT)",
      ),
    ])
  })
  .then(() => client.login(settings.token))
