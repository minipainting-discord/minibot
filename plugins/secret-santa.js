const settings = require("../settings.json")

const SANTA_USAGE = {
  LIST: "`!santa list`",
  MATCH: "`!santa match`",
  SEND: "`!santa send`",
  STATUS: "`!santa status`",
  SHORT: "`!santa list | match | status`",
}

const TIER_THRESHOLD = 5000
const MAX_LETTER_SIZE = 1996 // 2000 chars discord limit - length of ">>> "
const NICE_TIER = "nice"
const NAUGHTY_TIER = "naughty"
const WEB_ROUTE = "/admin/santa"

const DEADLINE = "November 20th"

module.exports = {
  name: "secret-santa",

  setup: (bot) => {
    bot.data.set("secret-santa:pending", new Map())
    return bot.db.run(
      `CREATE TABLE IF NOT EXISTS secretSanta (
         userId TEXT PRIMARY KEY,
         letter TEXT,
         address TEXT,
         region TEXT,
         tier TEXT,
         matchWith TEXT
       )`,
    )
  },

  commands: [
    {
      keyword: "santa",
      availableInDM: true,
      mod: true,
      help: [
        `${SANTA_USAGE.LIST}: List current participants`,
        `${SANTA_USAGE.MATCH}: Generate matches`,
        `${SANTA_USAGE.SEND}: Send letters after matching`,
        `${SANTA_USAGE.STATUS}: Check if some people are writing letters`,
      ],
      execute: santa,
    },
  ],

  web: (app, bot) => {
    app.get(WEB_ROUTE, bot.utils.requireWebAuth(), santaHandler(bot))
  },

  async dmFilter(bot, message) {
    const pendingLetters = bot.data.get("secret-santa:pending")
    if (message.author === bot.client.user) {
      return
    }

    const guildMember = await bot.findMember(message.author.id)

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
        if (message.content.match(/^na|eu|any$/i)) {
          message.reply(
            "Got it! Now please type your full name and address (in one discord message)",
          )
          letter.region = message.content.toUpperCase()
        } else {
          message.reply("Wut? Please answer `NA`, `EU` or `ANY`")
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
            bot.client.channels.cache
              .get(settings.channels.mod)
              .send(`:santa: New letter from ${guildMember.displayName}`)
            bot.log(`[santa] Saved letter for ${message.author.username}`)
          })
          .catch((err) =>
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
      bot.log(`[santa] Started list for ${message.author.username}`)
      message.reply(
        [
          "Ho ho ho! I got your letter little hooman!",
          "Now where are you willing to ship stuff? (Answer `NA`, `EU` or `ANY`)",
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
  if (!bot.fromModerator(message)) {
    return
  }

  switch (command) {
    case "list":
      santaList(bot, message)
      break
    case "match":
      santaMatch(bot, message)
      break
    case "send":
      santaSend(bot, message)
      break
    case "status":
      santaStatus(bot, message)
      break
    default:
      message.reply(SANTA_USAGE.SHORT)
  }
}

function santaList(bot, message) {
  bot.db
    .all(
      `SELECT userId, region, tier, matchWith FROM secretSanta ORDER BY region, tier DESC`,
    )
    .then((results) =>
      results.map((r) => ({
        ...r,
        member: bot.findMember(r.userId),
        match: bot.findMember(r.matchWith),
      })),
    )
    .then((results) => {
      if (!results.length) {
        message.reply(":shrug:")
        return
      }

      const longestNameLength = results
        .map((r) => [...r.member.displayName].length)
        .sort((a, b) => b - a)
        .shift()

      const volunteerList = results
        .map(
          (r) =>
            `${r.tier.padEnd(7, " ")} | ${r.region.padEnd(
              4,
              " ",
            )} | ${r.member.displayName.padEnd(longestNameLength, " ")}${
              r.match ? ` 🎁 by ${r.match.displayName}` : ""
            }`,
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

async function santaMatch(bot, message) {
  const letters = await bot.db.all(`SELECT * FROM secretSanta`)
  letters.forEach((l) => {
    l.user = bot.findMember(l.userId)
  })

  const groups = {
    naughty: { NA: [], EU: [], ANY: [] },
    nice: { NA: [], EU: [], ANY: [] },
  }

  for (const letter of letters) {
    groups[letter.tier][letter.region].push(letter)
  }

  // SPECIAL RULE: If someone is alone in nice/any, rematch with the admin
  if (groups.nice.ANY.length === 1) {
    const admin = bot.guild.members.cache.find((m) =>
      m.roles.cache.has(bot.roles.admin.id),
    )
    const adminLetter = letters.find((l) => l.userId === admin.user.id)
    const group = groups[adminLetter.tier][adminLetter.region]
    group.splice(group.indexOf(adminLetter), 1)
    groups.nice.ANY.push(adminLetter)
    bot.log("[santa] rematched admin to Nice/ANY")
  }

  for (const tier of [NAUGHTY_TIER, NICE_TIER]) {
    for (const region of Object.keys(groups[tier])) {
      const group = groups[tier][region]
      const shuffled = bot.utils.shuffle(group)
      groups[tier][region] = shuffled

      if (!shuffled.length) {
        continue
      }

      shuffled.forEach(async (member, i) => {
        const match = shuffled[(i + 1) % shuffled.length]
        await bot.db.run(
          "UPDATE secretSanta set matchWith = ? WHERE userId = ?",
          [match.user.id, member.user.id],
        )
      })
    }
  }

  message.reply("Generated matches, use `!santa send` to notify users.")
}

async function santaSend(bot, message) {
  const letters = await bot.db.all(`SELECT * FROM secretSanta`)

  for (const letter of letters) {
    if (!letter.matchWith) {
      message.reply("Not everyone is matched! Please match people first.")
      return
    }
  }

  for (const letter of letters) {
    const user = bot.findMember(letter.userId)
    const match = bot.findMember(letter.matchWith)
    const { letter: content, address } = letter

    match.user.createDM().then((dmChannel) => {
      dmChannel.send(
        [
          "Hello dear minipainter,",
          "You volunteered to take part in our annual Secret Santa and we thank you for that!",
          "",
          `I picked a giftee for you and it is **${user.displayName}**!`,
          "Here is their Santa letter:",
        ].join("\n"),
      )
      dmChannel.send(`>>> ${content}`)
      dmChannel.send([
        "Pick at least one item in this list, buy it and send it to this address:",
        address.replace(/^/gm, "> "),
        "You can of course buy more than one item and/or throw in whatever additional gift you think would please that person.",
        "",
        "You also have been picked as a giftee for someone else!",
        "",
        `Last thing, please don't forget to send your package before **${DEADLINE}**.`,
      ])
      bot.log(`Sent letter to ${match.displayName}`)
    })
  }

  message.reply("Letters sent! :snowflake: :rocket:")
}

async function santaStatus(bot, message) {
  const pendingLetters = bot.data.get("secret-santa:pending")

  if (!pendingLetters.size) {
    message.reply("There are currently no letters being written.")
    return
  }

  const users = await Promise.all(
    Array.from(pendingLetters.keys()).map(
      async (id) => await bot.findMember(id),
    ),
  )

  message.reply(
    `There are currently ${
      pendingLetters.size
    } letters being written. (${users.map((u) => u.displayName).join(", ")})`,
  )
}

function santaHandler(bot) {
  return (req, res) => {
    bot.log(`WEB ${WEB_ROUTE}`)

    bot.db
      .all(`SELECT * FROM secretSanta ORDER BY region, tier DESC`)
      .then(async (results) => {
        const guildMembers = new Map(
          await Promise.all(
            results.map((r) => [r.userId, bot.findMember(r.userId)]),
          ),
        )

        res.render("santa", { results, guildMembers })
      })
      .catch(() => res.status(500).send("Internal server error"))
  }
}
