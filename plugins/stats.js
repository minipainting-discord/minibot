const WEB_ROUTE = "/stats"

module.exports = {
  name: "stats",

  setup: bot =>
    bot.db.run(
      `CREATE TABLE IF NOT EXISTS stats (
        userId    TEXT,
        channelId TEXT,
        year      INTEGER,
        month     INTEGER,
        day       INTEGER,
        count     INTEGER,
        PRIMARY KEY (userId, channelId, year, month, day)
      )`,
    ),

  filter,

  web: (app, bot) => {
    app.get(WEB_ROUTE, bot.utils.requireWebAuth(), statsHandler(bot))
  },
}

function filter(bot, message) {
  const date = new Date()

  bot.db
    .run(
      `INSERT INTO stats (userId, channelId, year, month, day, count)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(userId, channelId, year, month, day) DO
         UPDATE SET count = count + 1`,
      [
        message.author.id,
        message.channel.id,
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate(),
        1,
      ],
    )
    .catch(err => {
      bot.logError(err, "Error updating stats")
    })
}

function statsHandler(bot) {
  return (req, res) => {
    bot.log(`WEB ${WEB_ROUTE}`)
    bot.db
      .all(
        `SELECT channelId, year, month, day, sum(count) as dailyCount FROM stats GROUP BY channelId, year, month, day`,
      )
      .then(stats => {
        for (const channelStat of stats) {
          const channel = bot.guild.channels.get(channelStat.channelId)
          channelStat.channelName = channel ? channel.name : "deleted-channel"
        }
        res.render("stats", { stats })
      })
  }
}
