const Discord = require("discord.js")
const { randomItem } = require("../utils")

// TODO: This mess should be cleaned up

const USAGE = "`!addpoints USER AMOUNT [ANNUAL]`"

const RANK_UP_GIFS = [
  "images/addpoints/rank-up-1.gif",
  "images/addpoints/rank-up-2.gif",
]

const RANK_DOWN_GIFS = [
  "images/addpoints/rank-down-1.gif",
  "images/addpoints/rank-down-2.gif",
  "images/addpoints/rank-down-3.gif",
]

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

    const amount = parseFloat(args[1], 10)
    const annual = args.length > 2 ? parseFloat(args[2], 10) : amount

    if (isNaN(amount) || isNaN(annual)) {
      message.reply("Is that even a number?")
      return
    }

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
      bot.db
        .get(`SELECT * FROM annual WHERE userId ='${user.id}'`)
        .then(row => {
          if (!row) {
            bot.db
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
        .catch(err => bot.logError(err, "Unknown error selecting annual score"))
    }

    function doLifetime() {
      bot.db
        .get(`SELECT * FROM scores WHERE userId ='${user.id}'`)
        .then(row => {
          if (!row) {
            bot.db
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
        .catch(err =>
          bot.logError(err, "Unknown error selecting lifetime score"),
        )
    }

    doLifetime()
  },
}

function set_points(bot, message, user, new_points, current_level, annual_add) {
  message.guild
    .fetchMember(user)
    .then(member => {
      let old_rank = bot.ranks.find(r => r.level === current_level)
      let new_rank = null

      for (let rank of bot.ranks) {
        if (new_points >= rank.minPoints) {
          new_rank = rank
        }
      }

      var cmd

      if (old_rank != new_rank) {
        if (old_rank) {
          member.removeRole(old_rank.role).catch(bot.logError)
        }
        if (new_rank || old_rank) {
          const { message, gif } = new_rank
            ? new_rank.level > current_level
              ? {
                  message: ` :confetti_ball: Congratulations you reached **${new_rank.role.name}** rank! :confetti_ball:`,
                  gif: randomItem(RANK_UP_GIFS),
                }
              : {
                  message: ` SKREEEOONK!!! DEMOTED TO **${new_rank.role.name}**`,
                  gif: randomItem(RANK_DOWN_GIFS),
                }
            : {
                message: ` SKREEEOONK!!! ANNIHILATED`,
                gif: randomItem(RANK_DOWN_GIFS),
              }
          bot.client.channels
            .get(bot.settings.channels.general)
            .send(user + message, new Discord.Attachment(gif))

          if (new_rank) {
            member.addRole(new_rank.role).catch(bot.logError)
          }
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

      bot.db
        .run(cmd)
        .then(() => {
          bot.db
            .run(
              `UPDATE annual SET points = ${annual_add} WHERE userId = ${user.id}`,
            )
            .then(() => {
              bot.db
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
