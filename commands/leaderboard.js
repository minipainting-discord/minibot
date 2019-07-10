const Discord = require("discord.js")

module.exports = {
  keyword: "leaderboard",
  help: "`!leaderboard`: Check the points leaderboard",
  execute: (bot, message) => {
    Promise.all([
      new Promise(resolve => {
        bot.db.score
          .all(`SELECT * FROM scores ORDER BY points DESC LIMIT 10`)
          .then(results => {
            Promise.all(results.map(r => bot.client.fetchUser(r.userId))).then(
              users => resolve({ results, users }),
            )
          })
      }),
      new Promise(resolve => {
        bot.db.score
          .all(`SELECT * FROM annual ORDER BY points DESC LIMIT 10`)
          .then(results => {
            Promise.all(results.map(r => bot.client.fetchUser(r.userId))).then(
              users => resolve({ results, users }),
            )
          })
      }),
    ])
      .then(([scores, annual]) => {
        const embed = new Discord.RichEmbed({
          color: 0x0088aa,
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
