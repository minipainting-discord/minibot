const settings = require("../settings.json")

const TIER_THRESHOLD = 5000
const NICE_TIER = "nice"
const NAUGHTY_TIER = "naughty"

const EXCHANGE_USAGE = {
  LIST: "`!exchange list`",
  MATCH: "`!exchange match`",
  SEND: "`!exchange send`",
  STATUS: "`!exchange status`",
  SHORT: "`!exchange list | match | status`",
}

const DEADLINE = "November 15th"

module.exports = {
  name: "painted-exchange",

  setup: (bot) => {
    bot.data.set("painted-exchange:pending", new Map())
    return bot.db.run(
      `CREATE TABLE IF NOT EXISTS paintedExchange (
         userId TEXT PRIMARY KEY,
         address TEXT,
         region TEXT,
         tier TEXT,
         matchWith TEXT
       )`,
    )
  },

  commands: [
    {
      keyword: "exchange",
      availableInDM: true,
      mod: true,
      help: [
        `${EXCHANGE_USAGE.LIST}: List current participants`,
        `${EXCHANGE_USAGE.MATCH}: Generate matches`,
        `${EXCHANGE_USAGE.SEND}: Send after matching`,
        `${EXCHANGE_USAGE.STATUS}: Check if some people are registering`,
      ],
      execute: exchange,
    },
  ],

  async dmFilter(bot, message) {
    const pendingRegistrations = bot.data.get("painted-exchange:pending")
    if (message.author === bot.client.user) {
      return
    }

    const guildMember = await bot.findMember(message.author.id)

    if (!guildMember) {
      message.reply("Join us at https://discord.gg/WREsGYF")
      return
    }

    if (pendingRegistrations.has(message.author.id)) {
      const registration = pendingRegistrations.get(message.author.id)

      if (message.content.match(/^cancel$/i)) {
        message.reply(":disappointed:")
        pendingRegistrations.delete(message.author.id)
        return true
      }

      if (!registration.region) {
        if (message.content.match(/^na|eu|any$/i)) {
          message.reply(
            "Got it! Now please type your full name and address (in one discord message)",
          )
          registration.region = message.content.toUpperCase()
        } else {
          message.reply("Wut? Please answer `NA`, `EU` or `ANY`")
        }
        return true
      }

      if (!registration.address) {
        registration.address = message.content
        message.reply(
          [
            "Great, now please tell me how many total messages have you posted around here?",
            "You can find this info by searching for your own messages like so http://drop.yapok.org/2019-11-03T11:42:14.png",
          ].join("\n"),
        )
        return true
      }

      if (!registration.tier) {
        const count = parseInt(message.content.replace(/[^0-9]/g, ""), 10)

        if (isNaN(count)) {
          message.reply(":thinking: Please enter a number")
          return true
        }

        registration.tier = count >= TIER_THRESHOLD ? NICE_TIER : NAUGHTY_TIER
        recap(message, registration)
        return true
      }

      if (message.content.match(/^confirm$/i)) {
        bot.db
          .run(
            "INSERT INTO paintedExchange (userId, address, region, tier) VALUES (?, ?, ?, ?)" +
              " ON CONFLICT(userId) DO UPDATE SET address=?, region=?, tier=?",
            [
              message.author.id,
              registration.address,
              registration.region,
              registration.tier,
              registration.address,
              registration.region,
              registration.tier,
            ],
          )
          .then(() => {
            message.reply(
              "All good! If you made a mistake or want to edit your details, just repeat the whole process.",
            )
            bot.client.channels.cache
              .get(settings.channels.mod)
              .send(
                `:recycle: New exchange registration from ${guildMember.displayName}`,
              )
            bot.log(
              `[exchange] Saved registration for ${message.author.username}`,
            )
          })
          .catch((err) =>
            bot.logError(
              err,
              `Error while saving registration for user ${message.author.username}`,
            ),
          )
        pendingRegistrations.delete(message.author.id)
      } else {
        recap(message, registration)
      }
      return true
    }

    if (message.content.match(/^i'm in for the exchange/i)) {
      pendingRegistrations.set(message.author.id, {})
      bot.log(`[exchange] Started registration for ${message.author.username}`)
      message.reply(
        [
          "Really? That's great!",
          "Now where are you willing to ship your autumn challenge mini? (Answer `NA`, `EU` or `ANY`)",
          "You can also `CANCEL` anytime.",
        ].join("\n"),
      )
      return true
    }
  },
}

function recap(message, registration) {
  message.reply(
    [
      "Good! Let's recap!",
      `You are willing to ship to **${registration.region}**`,
      "Your full address is:",
      registration.address.replace(/^/gm, "> "),
      `You will be matched with people from the **${registration.tier}** tier`,
      "If that is correct, please answer `CONFIRM`. If not, please type `CANCEL` and start over.",
    ].join("\n"),
  )
}

function exchange(bot, message, command) {
  if (!bot.fromModerator(message)) {
    return
  }

  switch (command) {
    case "list":
      exchangeList(bot, message)
      break
    case "match":
      exchangeMatch(bot, message)
      break
    case "send":
      exchangeSend(bot, message)
      break
    case "status":
      exchangeStatus(bot, message)
      break
    default:
      message.reply(EXCHANGE_USAGE.SHORT)
  }
}

function exchangeList(bot, message) {
  bot.db
    .all(
      `SELECT userId, region, tier, matchWith FROM paintedExchange ORDER BY region, tier DESC`,
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

      message.reply(["\n>>> ```", volunteerList, "```"].join("\n"))
    })
}

async function exchangeMatch(bot, message) {
  const registrations = await bot.db.all(`SELECT * FROM paintedExchange`)
  registrations.forEach((r) => {
    r.user = bot.findMember(r.userId)
  })

  const groups = {
    naughty: { NA: [], EU: [], ANY: [] },
    nice: { NA: [], EU: [], ANY: [] },
  }

  for (const registration of registrations) {
    groups[registration.tier][registration.region].push(registration)
  }

  // SPECIAL RULE: If someone is alone in nice/any, rematch with the admin
  if (groups.nice.ANY.length === 1) {
    const admin = bot.guild.members.cache.find((m) =>
      m.roles.cache.has(bot.roles.admin.id),
    )
    const adminRegistration = registrations.find(
      (r) => r.userId === admin.user.id,
    )
    const group = groups[adminRegistration.tier][adminRegistration.region]
    group.splice(group.indexOf(adminRegistration), 1)
    groups.nice.ANY.push(adminRegistration)
    bot.log("[exchange] rematched admin to Nice/ANY")
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
          "UPDATE paintedExchange set matchWith = ? WHERE userId = ?",
          [match.user.id, member.user.id],
        )
      })
    }
  }

  message.reply("Generated matches, use `!exchange send` to notify users.")
}

async function exchangeSend(bot, message) {
  const registrations = await bot.db.all(`SELECT * FROM paintedExchange`)

  for (const registration of registrations) {
    if (!registration.matchWith) {
      message.reply("Not everyone is matched! Please match people first.")
      return
    }
  }

  for (const registration of registrations) {
    const user = bot.findMember(registration.userId)
    const match = bot.findMember(registration.matchWith)
    const { address } = registration

    match.user.createDM().then((dmChannel) => {
      dmChannel.send([
        "Hello dear minipainter,",
        "You volunteered to take part in our annual painted miniature exchange and we thank you for that!",
        "",
        `I picked a giftee for you and it is **${user.displayName}**!`,
        "Now send them your autumn challenge mini at this address:",
        address.replace(/^/gm, "> "),
        "",
        "You also have been picked as a giftee for someone else!",
        "",
        `Last thing, please don't forget to send your package before **${DEADLINE}**.`,
      ])
      bot.log(`Sent match info to ${match.displayName}`)
    })
  }

  message.reply("Registrations sent! :fallen_leaf: :rocket:")
}

async function exchangeStatus(bot, message) {
  const pendingRegistrations = bot.data.get("painted-exchange:pending")

  if (!pendingRegistrations.size) {
    message.reply("There are currently no registrations ongoing.")
    return
  }

  const users = await Promise.all(
    Array.from(pendingRegistrations.keys()).map(
      async (id) => await bot.findMember(id),
    ),
  )

  message.reply(
    `There are currently ${
      pendingRegistrations.size
    } registrations being written. (${users
      .map((u) => u.displayName)
      .join(", ")})`,
  )
}
