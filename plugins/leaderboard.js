const Discord = require("discord.js")

const WEB_ROUTE = "/leaderboard"

module.exports = {
  name: "leaderboard",
  web: (app, bot) => {
    app.get(WEB_ROUTE, (req, res) => {
      bot.log(`WEB ${WEB_ROUTE}`)
      retrieveScores(bot, "all").then(([scores, annual]) => {
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

function retrieveScores(bot, all = false) {
  const limit = all ? "" : "LIMIT 10"
  return bot.guild.fetchMembers().then(() => {
    return Promise.all([
      new Promise(resolve => {
        bot.db
          .all(`SELECT * FROM scores ORDER BY points DESC ${limit}`)
          .then(results =>
            Promise.all(results.map(r => bot.findMember(r.userId))).then(
              users =>
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
          .all(`SELECT * FROM annual ORDER BY points DESC ${limit}`)
          .then(results =>
            Promise.all(results.map(r => bot.findMember(r.userId))).then(
              users =>
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
