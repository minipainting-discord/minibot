const SANTA_USAGE = "`!santa list | !santa pair`"

module.exports = {
  name: "secret-santa",

  setup: bot => {
    bot.data.set("secret-santa:pending", new Map())
    return bot.db.run(
      "CREATE TABLE IF NOT EXISTS secretSanta (userId TEXT, letter TEXT, address TEXT, region TEXT)",
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

  dmFilter(bot, message) {
    const pendingLetters = bot.data.get("secret-santa:pending")
    if (message.author === bot.client.user) {
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
        recap(message, letter)
        return true
      }

      if (message.content.match(/^confirm$/i)) {
        bot.db
          .run(
            "INSERT INTO secretSanta (userId, letter, region) VALUES (?, ?, ?)",
            [message.author.id, letter.content, letter.region],
          )
          .then(() => {
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
      letter.content.replace(/^/gm, "> "),
      "Your full address is:",
      letter.address.replace(/^/gm, "> "),
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
    default:
      message.reply(SANTA_USAGE)
  }
}

function santaList(bot, message) {
  const guild = bot.client.guilds.first()

  bot.db
    .all(`SELECT userId, region FROM secretSanta ORDER BY region`)
    .then(results =>
      Promise.all(
        results.map(r => guild.members.find(u => u.id === r.userId)),
      ).then(volunteers => {
        message.reply(
          [
            "",
            ">>> ```",
            volunteers
              .map((v, i) => `${results[i].region} ${v.displayName}`)
              .join("\n"),
            "```",
          ].join("\n"),
        )
      }),
    )
}

function santaPair(bot, message) {
  if (bot.moderatorOnly(message)) {
    return
  }

  message.reply("Not yet!")
}
