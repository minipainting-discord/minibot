const settings = require("../settings.json")

const SANTA_USAGE = "`!santa list | !santa pair`"

const TIER_THRESHOLD = 4000
const MAX_LETTER_SIZE = 1996 // 2000 chars discord limit - length of ">>> "
const NICE_TIER = "nice"
const NAUGHTY_TIER = "naughty"
const WEB_ROUTE = "/admin/santa"

module.exports = {
  name: "secret-santa",

  setup: bot => {
    bot.data.set("secret-santa:pending", new Map())
    return bot.db.run(
      "CREATE TABLE IF NOT EXISTS secretSanta (userId TEXT PRIMARY KEY, letter TEXT, address TEXT, region TEXT, tier TEXT)",
    )
  },

  commands: [
    {
      keyword: "santa",
      mod: true,
      help: `${SANTA_USAGE}: Secret Santa specific command`,
      execute: santa,
    },
  ],

  web: (app, bot) => {
    app.get(WEB_ROUTE, bot.requireWebAuth(), santaHandler(bot))
  },

  async dmFilter(bot, message) {
    const guild = bot.client.guilds.first()

    const pendingLetters = bot.data.get("secret-santa:pending")
    if (message.author === bot.client.user) {
      return
    }

    const guildMember = await guild.members.find(
      u => u.id === message.author.id,
    )

    if (!guildMember) {
      message.reply("Join us at https://discord.gg/WREsGYF")
      return
    }

    if (pendingLetters.has(message.author.id)) {
      const letter = pendingLetters.get(message.author.id)

      if (message.content.match(/^cancel$/i)) {
        message.reply(":disappointed:")
        pendingLetters.delete(message.author.id)
        return true
      }

      if (!letter.region) {
        if (message.content.match(/^na|eu|intl$/i)) {
          message.reply(
            "Got it! Now please type your full name and address (in one discord message)",
          )
          letter.region = message.content.toUpperCase()
        } else {
          message.reply("Wut? Please answer `NA`, `EU` or `INTL`")
        }
        return true
      }

      if (!letter.address) {
        letter.address = message.content
        message.reply(
          [
            "Great, now please tell me how many total messages have you posted around here?",
            "You can find this info by searching for your own messages like so http://drop.yapok.org/2019-11-03T11:42:14.png",
          ].join("\n"),
        )
        return true
      }

      if (!letter.tier) {
        const count = parseInt(message.content.replace(/[^0-9]/g, ""), 10)

        if (isNaN(count)) {
          message.reply(":thinking: Please enter a number")
          return true
        }

        letter.tier = count >= TIER_THRESHOLD ? NICE_TIER : NAUGHTY_TIER
        recap(message, letter)
        return true
      }

      if (message.content.match(/^confirm$/i)) {
        bot.db
          .run(
            "INSERT INTO secretSanta (userId, letter, address, region, tier) VALUES (?, ?, ?, ?, ?)" +
              " ON CONFLICT(userId) DO UPDATE SET letter=?, address=?, region=?, tier=?",
            [
              message.author.id,
              letter.content,
              letter.address,
              letter.region,
              letter.tier,
              letter.content,
              letter.address,
              letter.region,
              letter.tier,
            ],
          )
          .then(() => {
            message.reply(
              "All good! If you made a mistake or want to edit your letter, just repeat the whole process.",
            )
            bot.client.channels
              .get(settings.channels.mod)
              .send(`:santa: New letter from ${guildMember.displayName}`)
            bot.log(`Saved secret santa letter for ${message.author.username}`)
          })
          .catch(err =>
            bot.logError(
              err,
              `Error while saving letter for user ${message.author.username}`,
            ),
          )
        pendingLetters.delete(message.author.id)
      } else {
        recap(message, letter)
      }
      return true
    }

    if (message.content.match(/^dear\s+santa/i)) {
      if (message.content.length > MAX_LETTER_SIZE) {
        message.reply(
          `Your letter is wayyyyyyy too long, please shorten it a bit (${MAX_LETTER_SIZE} chars max)`,
        )
        return true
      }
      pendingLetters.set(message.author.id, { content: message.content })
      message.reply(
        [
          "Ho ho ho! I got your letter little hooman!",
          "Now where are you willing to ship stuff? (Answer `NA`, `EU` or `INTL`)",
          "You can also `CANCEL` anytime.",
        ].join("\n"),
      )
      return true
    }
  },
}

function recap(message, letter) {
  message.reply(
    [
      "Good! Let's recap!",
      `You are willing to ship to **${letter.region}**`,
      "Your letter to Santa is:",
    ].join("\n"),
  )
  message.reply(">>> " + letter.content)
  message.reply(
    [
      "Your full address is:",
      letter.address.replace(/^/gm, "> "),
      `You will be matched with people from the **${letter.tier}** tier`,
      "If that is correct, please answer `CONFIRM`. If not, please type `CANCEL` and start over.",
    ].join("\n"),
  )
}

function santa(bot, message, command) {
  if (bot.moderatorOnly(message)) {
    return
  }

  switch (command) {
    case "list":
      santaList(bot, message)
      break
    case "pair":
      santaPair(bot, message)
      break
    case "status":
      santaStatus(bot, message)
      break
    default:
      message.reply(SANTA_USAGE)
  }
}

function santaList(bot, message) {
  const guild = bot.client.guilds.first()

  bot.db
    .all(
      `SELECT userId, region, tier FROM secretSanta ORDER BY region, tier DESC`,
    )
    .then(async results => {
      const guildMembers = new Map(
        await Promise.all(
          results.map(r => [
            r.userId,
            guild.members.find(u => u.id === r.userId),
          ]),
        ),
      )

      if (!results.length) {
        message.reply(":shrug:")
        return
      }

      const volunteerList = results
        .map(
          r =>
            `[${r.tier}] ${r.region} ${guildMembers.get(r.userId).displayName}`,
        )
        .join("\n")

      message.reply(
        [
          "\n>>> ```",
          volunteerList,
          "```",
          `See full Secret Santa info at ${bot.settings.serverUrl + WEB_ROUTE}`,
        ].join("\n"),
      )
    })
}

function santaPair(bot, message) {
  if (bot.moderatorOnly(message)) {
    return
  }

  message.reply("Not yet!")
}

async function santaStatus(bot, message) {
  const guild = bot.client.guilds.first()

  const pendingLetters = bot.data.get("secret-santa:pending")

  if (!pendingLetters.size) {
    message.reply("There are currently no letters being written")
    return
  }

  const users = await Promise.all(
    Array.from(pendingLetters.keys()).map(
      async id => await guild.members.find(u => u.id === id),
    ),
  )

  message.reply(
    `There are currently ${
      pendingLetters.size
    } letters being written. (${users.map(u => u.displayName).join(", ")})`,
  )
}

function santaHandler(bot) {
  return (req, res) => {
    bot.log(`WEB ${WEB_ROUTE}`)

    const guild = bot.client.guilds.first()

    bot.db
      .all(`SELECT * FROM secretSanta ORDER BY region, tier DESC`)
      .then(async results => {
        const guildMembers = new Map(
          await Promise.all(
            results.map(r => [
              r.userId,
              guild.members.find(u => u.id === r.userId),
            ]),
          ),
        )

        res.render("santa", { results, guildMembers })
      })
      .catch(() => res.status(500).send("Internal server error"))
  }
}
