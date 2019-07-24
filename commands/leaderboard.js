const Discord = require("discord.js")

function retrieveScores(bot, all = false) {
  return Promise.all([
    new Promise(resolve => {
      bot.db
        .all(
          `SELECT * FROM scores ORDER BY points DESC ${all ? "" : "LIMIT 10"}`,
        )
        .then(results => {
          Promise.all(results.map(r => bot.client.fetchUser(r.userId))).then(
            users => resolve({ results, users }),
          )
        })
    }),
    new Promise(resolve => {
      bot.db
        .all(
          `SELECT * FROM annual ORDER BY points DESC ${all ? "" : "LIMIT 10"}`,
        )
        .then(results => {
          Promise.all(results.map(r => bot.client.fetchUser(r.userId))).then(
            users => resolve({ results, users }),
          )
        })
    }),
  ])
}

module.exports = {
  keyword: "leaderboard",
  help: "`!leaderboard`: Check the points leaderboard",

  web: (app, bot) => {
    app.get("/leaderboard", (req, res) => {
      retrieveScores(bot, true).then(([scores, annual]) => {
        res.render("leaderboard", { scores, annual })
      })
    })
  },

  execute: (bot, message) => {
    retrieveScores(bot)
      .then(([scores, annual]) => {
        const embed = new Discord.RichEmbed({
          color: 0x0088aa,
          description: `[See full leaderboard](${bot.settings.serverUrl}/leaderboard)`,
          fields: [
            {
              name: "Lifetime Leaderboard",
              value: [
                "```",
                scores.results
                  .map((r, i) =>
                    [r.points, scores.users[i].username].join(" - "),
                  )
                  .join("\n"),
                "```",
              ].join("\n"),
            },
            {
              name: "Annual Leaderboard",
              value: [
                "```",
                annual.results
                  .map((r, i) =>
                    [r.points, annual.users[i].username].join(" - "),
                  )
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
  },
}
