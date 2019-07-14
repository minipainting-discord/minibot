module.exports = {
  keyword: "annual",
  help: [
    "`!annual reset`: Save current annual scores and start a new year [admin]",
    "`!annual list`: List saved annual score tables [admin]",
    "`!annual restore table_name`: Restore annual scores from a given table [admin]",
  ],
  mod: true,
  execute: (bot, message, ...args) => {
    if (!message.member.roles.has(bot.roles.admin.id)) {
      return
    }

    const timestamp = Date.now()

    switch (args[0]) {
      case "reset":
        bot.db
          .run(
            `CREATE TABLE IF NOT EXISTS annual_${timestamp} (userId TEXT, points INTEGER)`,
          )
          .then(() => {
            bot.db
              .run(`INSERT INTO annual_${timestamp} SELECT * FROM annual`)
              .then(() => {
                bot.db.run(`DELETE FROM annual`).then(() => {
                  message.reply(
                    "Annual scores reset and moved to annual_" + timestamp,
                  )
                })
              })
          })
        break
      case "list":
        bot.db
          .all(
            `SELECT name FROM sqlite_master WHERE type ='table' AND name LIKE 'annual_%' ORDER BY name DESC LIMIT 10`,
          )
          .then(results => {
            if (results) {
              const msg = [
                "```",
                ...results.map(r => `  - ${r.name}`),
                "```",
              ].join("\n")
              message.reply(msg)
            }
          })
        break
      case "restore":
        {
          const tableName = args[1]

          if (!tableName) {
            message.reply("`!annual restore table_name`")
            return
          }
          bot.db
            .run(`SELECT * FROM ${tableName} ORDER BY ROWID ASC LIMIT 1`)
            .then(() => {
              bot.db
                .run(
                  `CREATE TABLE IF NOT EXISTS annual_${timestamp} (userId TEXT, points INTEGER)`,
                )
                .then(() => {
                  bot.db
                    .run(`INSERT INTO annual_${timestamp} SELECT * FROM annual`)
                    .then(() => {
                      bot.db.run(`DELETE FROM annual`).then(() => {
                        bot.db
                          .run(`INSERT INTO annual SELECT * FROM ${tableName}`)
                          .then(() => {
                            message.reply(
                              "Current annual score moved to annual_" +
                                timestamp +
                                " and restored from " +
                                tableName,
                            )
                          })
                      })
                    })
                })
            })
            .catch(bot.logError)
        }
        break
      default:
        message.reply(
          `unknown command ${
            args[0]
          }. Available commands: reset, restore, list`,
        )
    }
  },
}
