const Discord = require("discord.js")

const USAGE = "`!addpoints USER AMOUNT [ANNUAL]`"

const RANK_UP_GIFS = Array.from(
  { length: 13 },
  (_, i) => `images/addpoints/rank-up-${i + 1}.gif`,
)

const RANK_DOWN_GIFS = Array.from(
  { length: 9 },
  (_, i) => `images/addpoints/rank-down-${i + 1}.gif`,
)

const MIN_CNC_POINTS = 10

const CNC_RULES = `
Hello, you just unlocked access to the #contructive-critique channel on the minipainting server.

Here you will find the rules for this channel. We've gotten many complaints about this channel and have been in talks about how to fix it for some time, it may change further in the future, but for now, here are the rules you must follow.

> **1.** You must post a photo of the miniature in need of critique.
> 
> **2.** Your post must also contain the following information:
> 
> * What specific critique are you looking for? i.e. the overall paintjob, a specific part you've been working on, the hair, the sword, etc.
> 
> * What is the model for, so that we can get a rough idea of the standard you're aiming for, i.e. it's for an army, it's a D&D character or a centerpiece in an army.
> 
> **3.** If you are posting more than one photo, upload the photos to an album on www.imgur.com and post a link to the album. Posts that contain more than one photo, not in an album, will be removed without question. (We'll work on an integrated way to do this soon, but for now use imgur.)
> 
> **4.** If you are GIVING critique, your criticism MUST be constructive, do not simply tell someone "not enough contrast." You must also tell them HOW to change it, how to improve and **add** more contrast. If you do not, your post will be removed without notice.
> 
> **5.** This channel is for ***CRITIQUE***. It is NOT for general questions, it is not for early WIP photos, it is for critique of finished, or nearly finished work and nothing else. Do not post models here that have only been basecoated, or only have a few layers of paint on them. Only post finished or nearly finished works.

For basic information and simple questions, #general-miniatures is the place to ask.
`

module.exports = {
  name: "addpoints",
  commands: [
    {
      keyword: "addpoints",
      help: `${USAGE}: Add or remove user points`,
      helpMod: true,
      execute: addpoints,
      allowAnywhere: true,
    },
  ],
}

async function addpoints(bot, message, ...args) {
  if (!bot.fromModerator(message)) {
    return
  }

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

  let newPoints = amount
  let annualPoints = annual
  let currentLevel = 0

  async function doLifetime() {
    try {
      const row = await bot.db.get(
        `SELECT * FROM scores WHERE userId = ?`,
        user.id,
      )
      if (row) {
        currentLevel = row.level || 0
        newPoints += row.points
      } else {
        try {
          await bot.db.run(
            "INSERT INTO scores (userId, points, level) VALUES (?, ?, ?)",
            [user.id, 0, 0],
          )
        } catch (err) {
          bot.logError(err, "Unknown error inserting new lifetime score record")
        }
      }
      await doAnnual()
    } catch (err) {
      bot.logError(err, "Unknown error selecting lifetime score")
    }
  }

  async function doAnnual() {
    try {
      const row = await bot.db.get(
        `SELECT * FROM annual WHERE userId = ?`,
        user.id,
      )
      if (row) {
        annualPoints += row.points
      } else {
        try {
          await bot.db.run(
            "INSERT INTO annual (userId, points) VALUES (?, ?)",
            [user.id, 0],
          )
        } catch (err) {
          bot.logError(err, "Unknown error inserting new annual score record")
        }
      }
      try {
        await setPoints(
          bot,
          message,
          user,
          newPoints,
          currentLevel,
          annualPoints,
        )
      } catch (err) {
        bot.logError(err, "Unable to update points")
      }
    } catch (err) {
      bot.logError(err, "Unknown error selecting annual score")
    }
  }

  await doLifetime()
}

async function setPoints(
  bot,
  message,
  user,
  newPoints,
  currentLevel,
  annualAdd,
) {
  const [member, memberErr] = await maybe(message.guild.members.fetch(user))
  if (memberErr) {
    return bot.logError(memberErr, "Unknown error retrieving GuildMember")
  }

  const oldRank = bot.ranks.find((r) => r.level === currentLevel)
  const newRank = bot.ranks
    .slice()
    .reverse()
    .find((r) => newPoints >= r.minPoints)

  let cmd

  if (oldRank != newRank) {
    if (oldRank) {
      member.roles.remove(oldRank.role).catch(bot.logError)
    }
    if (newRank) {
      member.roles.add(newRank.role).catch(bot.logError)
    }

    const { message, gif } = getRankingMessage(bot, newRank, currentLevel)
    bot.channels.general.send(
      `${user} ${message}`,
      new Discord.MessageAttachment(gif),
    )
    cmd = [
      "UPDATE scores SET points = ?, level = ? WHERE userId = ?",
      newPoints,
      newRank ? newRank.level : 0,
      user.id,
    ]
  } else {
    cmd = ["UPDATE scores SET points = ? WHERE userId = ?", newPoints, user.id]
  }

  if (
    newPoints >= MIN_CNC_POINTS &&
    !member.roles.cache.has(bot.roles.cnc.id)
  ) {
    member.roles.add(bot.roles.cnc).catch(bot.logError)
    try {
      const dmChannel = await member.createDM()
      await dmChannel.send(CNC_RULES)
    } catch (err) {
      bot.logError(err)
    }
  }

  bot.log(
    `Updated points for ${
      user.username
    } lifetime=${newPoints} annual=${annualAdd}${
      newRank ? ` new_rank="${newRank.name}"` : oldRank ? ` new_rank=""` : ""
    }`,
  )

  const [, lifetimeErr] = await maybe(bot.db.run(...cmd))
  if (lifetimeErr) {
    return bot.logError(lifetimeErr, "Unknown error updating lifetime score")
  }

  const [, annualErr] = await maybe(
    bot.db.run(
      "UPDATE annual SET points = ? WHERE userId = ?",
      annualAdd,
      user.id,
    ),
  )
  if (annualErr) {
    return bot.logError(annualErr, "Unknown error updating annual score")
  }

  const [newScore, newScoreErr] = await maybe(
    bot.db.get(
      "SELECT s.points AS s_points, ifnull(a.points, 0) AS a_points FROM scores s LEFT JOIN annual a ON s.userId = a.userId WHERE s.userId = ?",
      user.id,
    ),
  )
  if (newScoreErr) {
    return bot.logError(newScoreErr, "Unknown error selecting updated score")
  }
  message.reply(
    `${user} has ${newScore.s_points} lifetime points and ${newScore.a_points} current points`,
  )
}

async function maybe(promise) {
  try {
    return [await promise, null]
  } catch (err) {
    return [null, err]
  }
}

function getRankingMessage(bot, newRank, currentLevel) {
  return newRank
    ? newRank.level > currentLevel
      ? {
          message: `:confetti_ball: Congratulations you reached the **${newRank.role.name}** rank! :confetti_ball:`,
          gif: bot.utils.randomItem(RANK_UP_GIFS),
        }
      : {
          message: `SSKREEEOONK!!! DEMOTED TO **${newRank.role.name}**`,
          gif: bot.utils.randomItem(RANK_DOWN_GIFS),
        }
    : {
        message: `SKREEEOONK!!! ANNIHILATED`,
        gif: bot.utils.randomItem(RANK_DOWN_GIFS),
      }
}
