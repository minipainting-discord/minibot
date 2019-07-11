const settings = require("../settings.json")

// TODO: This mess should be cleaned up

const USAGE = "`!addpoints user amount [annual]`"

module.exports = {
  keyword: "addpoints",
  help: `${USAGE}: Add or remove user points`,
  helpMod: true,
  execute: (bot, message, ...args) => {
    const user = message.mentions.users.first()

    if (args.length < 2 || !user) {
      message.reply(USAGE)
      return
    }

    const amount = parseInt(args[1], 10)
    const annual = args.length > 2 ? parseInt(args[2], 10) : amount

    if (
      !message.member.roles.has(bot.roles.admin.id) &&
      !message.member.roles.has(bot.roles.mod.id)
    ) {
      message.reply(
        `:japanese_goblin:  Haha! Being sneaky are we? :japanese_goblin: `,
      )
      return
    }

    let new_points = amount
    let annual_points = annual
    let current_level = 0

    function doAnnual() {
      bot.db.score
        .get(`SELECT * FROM annual WHERE userId ='${user.id}'`)
        .then(row => {
          if (!row) {
            bot.db.score
              .run("INSERT INTO annual (userId, points) VALUES (?, ?)", [
                user.id,
                0,
              ])
              .catch(err => {
                bot.logError(
                  err,
                  "Unknown error inserting new annual score record",
                )
              })
          } else {
            annual_points += row.points
          }
          set_points(
            bot,
            message,
            user,
            new_points,
            current_level,
            annual_points,
          )
        })
        .catch(err => {
          if (err.message === "SQLITE_ERROR: no such table: annual") {
            bot.db.score
              .run(
                "CREATE TABLE IF NOT EXISTS annual (userId TEXT, points INTEGER)",
              )
              .then(() => {
                doAnnual()
              })
              .catch(err => {
                bot.logError(err, "Unknown error creating annual score table")
              })
          } else {
            bot.logError(err, "Unknown error selecting annual score")
          }
        })
    }

    function doLifetime() {
      bot.db.score
        .get(`SELECT * FROM scores WHERE userId ='${user.id}'`)
        .then(row => {
          if (!row) {
            bot.db.score
              .run(
                "INSERT INTO scores (userId, points, level) VALUES (?, ?, ?)",
                [user.id, 0, 0],
              )
              .catch(err => {
                bot.logError(
                  err,
                  "Unknown error inserting new lifetime score record",
                )
              })
          } else {
            current_level = row.level
            new_points += row.points
          }
          doAnnual()
        })
        .catch(err => {
          if (err.message === "SQLITE_ERROR: no such table: scores") {
            bot.db.score
              .run(
                "CREATE TABLE IF NOT EXISTS scores (userId TEXT, points INTEGER, level INTEGER)",
              )
              .then(() => {
                doLifetime()
              })
              .catch(err => {
                bot.logError(err, "Unknown error creating lifetime score table")
              })
          } else {
            bot.logError(err, "Unknown error selecting lifetime score")
          }
        })
    }

    doLifetime()
  },
}

function set_points(bot, message, user, new_points, current_level, annual_add) {
  message.guild
    .fetchMember(user)
    .then(member => {
      let ranks = settings.ranks.map((rank, level) => ({
        ...rank,
        level: level + 1,
        role: message.guild.roles.find(r => r.name === rank.name),
      }))

      let old_rank = ranks.find(r => r.level === current_level)
      let new_rank = null

      for (let rank of ranks) {
        if (new_points >= rank.minPoints) {
          new_rank = rank
        }
      }

      var cmd

      if (old_rank != new_rank) {
        if (old_rank) {
          member.removeRole(old_rank.role).catch(bot.logError)
        }
        if (new_rank) {
          bot.client.channels
            .get(settings.channels.general)
            .send(
              user +
                ` :confetti_ball: Congratulations you reached **${new_rank.role.name}** rank! :confetti_ball:`,
            )
          member.addRole(new_rank.role).catch(bot.logError)
        }
        cmd = `UPDATE scores SET points = ${new_points}, level = ${
          new_rank ? new_rank.level : 0
        } WHERE userId = ${user.id}`
      } else {
        cmd = `UPDATE scores SET points = ${new_points} WHERE userId = ${user.id}`
      }

      console.log(
        `[info] addpoints ${
          user.username
        } lifetime=${new_points} annual=${annual_add}${
          new_rank
            ? ` new_rank="${new_rank.name}"`
            : old_rank
            ? ` new_rank=""`
            : ""
        }`,
      )

      bot.db.score
        .run(cmd)
        .then(() => {
          bot.db.score
            .run(
              `UPDATE annual SET points = ${annual_add} WHERE userId = ${user.id}`,
            )
            .then(() => {
              bot.db.score
                .get(
                  `SELECT s.points AS s_points, ifnull(a.points, 0) AS a_points FROM scores s LEFT JOIN annual a ON s.userId = a.userId WHERE s.userId ='${user.id}'`,
                )
                .then(row => {
                  message.reply(
                    user +
                      ` has ${row.s_points} lifetime points and ${row.a_points} current points`,
                  )
                })
                .catch(err =>
                  bot.logError(err, "Unknown error selecting updated score"),
                )
            })
            .catch(err =>
              bot.logError(err, "Unknown error updating annual score"),
            )
        })
        .catch(err =>
          bot.logError(err, "Unknown error updating lifetime score"),
        )
    })
    .catch(err => bot.logError(err, "Unknown error retrieving GuildMember"))
}