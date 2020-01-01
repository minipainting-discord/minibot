const Discord = require("discord.js")

const WEB_ROUTE = "/leaderboard"
const ANNUAL_TABLE_RE = /^annual(?:_[0-9]+)?$/

module.exports = {
  name: "leaderboard",
  web: (app, bot) => {
    app.get(WEB_ROUTE, async (req, res) => {
      bot.log(`WEB ${WEB_ROUTE}`)
      const annualTables = await bot.db.all(`
        SELECT name
        FROM sqlite_master
        WHERE type='table' AND name LIKE 'annual%'
      `)

      const annualTable =
        req.query.table && req.query.table.match(ANNUAL_TABLE_RE)
          ? req.query.table
          : "annual"

      retrieveScores(bot, "all", annualTable).then(([scores, annual]) => {
        const colorToRGB = color =>
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
          annualTables,
          annualTable,
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

function leaderboard(bot, message) {
  retrieveScores(bot)
    .then(([scores, annual]) => {
      const embed = new Discord.RichEmbed({
        color: 0x0088aa,
        description: `[See full leaderboard](${bot.settings.serverUrl +
          WEB_ROUTE})`,
        fields: [
          {
            name: "Lifetime Leaderboard",
            value: [
              "```",
              scores
                .map(s => [s.points, s.user.displayName].join(" - "))
                .join("\n"),
              "```",
            ].join("\n"),
          },
          {
            name: "Annual Leaderboard",
            value: [
              "```",
              annual
                .map(s => [s.points, s.user.displayName].join(" - "))
                .join("\n"),
              "```",
            ].join("\n"),
          },
        ],
      })
      message.reply(embed)
    })
    .catch(err => {
      bot.logError(err)
      message.reply("Oops, something went wrong!")
    })
  return
}

function retrieveScores(bot, all = false, annualTable = "annual") {
  const limit = all ? "" : "LIMIT 10"
  return bot.guild.fetchMembers().then(() => {
    return Promise.all([
      new Promise(resolve => {
        bot.db
          .all(`SELECT * FROM scores ORDER BY points DESC ${limit}`)
          .then(results =>
            Promise.all(
              results.map(r => bot.findMember(r.userId)),
            ).then(users =>
              resolve(
                results
                  .map((r, i) => ({ ...r, user: users[i] }))
                  .filter(r => r.user),
              ),
            ),
          )
      }),
      new Promise(resolve => {
        bot.db
          .all(`SELECT * FROM ${annualTable} ORDER BY points DESC ${limit}`)
          .then(results =>
            Promise.all(
              results.map(r => bot.findMember(r.userId)),
            ).then(users =>
              resolve(
                results
                  .map((r, i) => ({ ...r, user: users[i] }))
                  .filter(r => r.user),
              ),
            ),
          )
      }),
    ])
  })
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
