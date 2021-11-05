const Discord = require("discord.js")

const WEB_ROUTE = "/leaderboard"
const MIN_YEAR = 2019

module.exports = {
  name: "leaderboard",
  web: (app, bot) => {
    app.get(WEB_ROUTE, async (req, res) => {
      bot.log(`WEB ${WEB_ROUTE}`)

      const currentYear = new Date().getFullYear()
      const selectedYear = (() => {
        if (req.query.year && req.query.year.match(/^[0-9]+$/)) {
          const year = parseInt(req.query.year, 10)
          return year >= MIN_YEAR && year < currentYear ? year : null
        }
        return null
      })()
      const annualTable = selectedYear ? `annual_${selectedYear}` : "annual"

      retrieveScores(bot, "all", annualTable).then(([scores, annual]) => {
        const colorToRGB = (color) =>
          [
            (color & 0xff0000) >> 16,
            (color & 0x00ff00) >> 8,
            (color & 0x0000ff) >> 0,
          ].join(",")
        res.render("leaderboard", {
          scores,
          annual,
          ranks: bot.ranks,
          colorToRGB,
          currentYear,
          selectedYear,
          MIN_YEAR,
        })
      })
    })
  },

  commands: [
    {
      keyword: "leaderboard",
      help: "`!leaderboard`: Check the points leaderboard",
      availableInDM: true,
      execute: leaderboard,
    },
    {
      keyword: "ranks",
      help: "`!ranks`: Display the ranks",
      availableInDM: true,
      execute: ranks,
    },
  ],
}

async function leaderboard(bot, message) {
  try {
    const [scores, annual] = await retrieveScores(bot)
    const embed = new Discord.MessageEmbed({
      color: 0x0088aa,
      description: `[See full leaderboard](${
        bot.settings.serverUrl + WEB_ROUTE
      })`,
      fields: [
        {
          name: "Lifetime Leaderboard",
          value: [
            "```",
            scores
              .map((s) => [s.points, s.userName || "Unknown User"].join(" - "))
              .join("\n"),
            "```",
          ].join("\n"),
        },
        {
          name: "Annual Leaderboard",
          value: [
            "```",
            annual
              .map((s) => [s.points, s.userName || "Unknown User"].join(" - "))
              .join("\n"),
            "```",
          ].join("\n"),
        },
      ],
    })
    message.reply(embed)
  } catch (err) {
    bot.logError(err)
    message.reply("Oops, something went wrong!")
  }
}

async function retrieveScores(bot, all = false, annualTable = "annual") {
  const limit = all ? "" : "LIMIT 10"
  const scores = await bot.db.all(
    `SELECT s.*, u.displayName as userName
     FROM scores s LEFT OUTER JOIN users u ON s.userId = u.userId
     ORDER BY points DESC ${limit}`,
  )
  const annual = await bot.db.all(
    `SELECT s.*, u.displayName as userName
     FROM ${annualTable} s LEFT OUTER JOIN users u ON s.userId = u.userId
     ORDER BY points DESC ${limit}`,
  )

  const missingUsers = new Set(
    [...scores, ...annual].filter((e) => !e.userName).map((e) => e.userId),
  )

  const missing = await bot.guild.members.fetch({
    user: [...missingUsers],
    withPresences: false,
  })

  return [scores, annual]

  // const scores = dbScores.map((s) => ({
  //   ...s,
  //   user: users.find((u) => u.userId === s.userId),
  // }))
  //
  // const annual = dbAnnual.map((s) => ({
  //   ...s,
  //   user: users.find((u) => u.userId === s.userId),
  // }))
  //
  // const missingUsers = [...scores, ...annual].filter(s => !s.user).map(s => s.userId)

  // return [scores, annual]
}

function ranks(bot, message) {
  const reply = [
    "**RANKS**",
    ...bot.ranks.map(
      (rank, index) => `    ${index + 1}. ${rank.name} - ${rank.minPoints}pts`,
    ),
  ].join("\n")
  message.reply(`\n>>> ${reply}`)
}
