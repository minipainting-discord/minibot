const SAY_USAGE = "`!say CHANNEL SOMETHING`"
const PRESENCE_USAGE = "`!presence ACTIVITY VALUE`"
const ACTIVITIES = ["playing", "streaming", "listening", "watching"]
const WEB_ROUTE = "/admin/audit"

module.exports = {
  name: "admin",
  description: "Bot administration and control commands and tools",
  setup: bot =>
    bot.db.run(
      "CREATE TABLE IF NOT EXISTS log (userId TEXT, location TEXT, command TEXT, arguments TEXT, date TEXT DEFAULT CURRENT_TIMESTAMP)",
    ),
  commands: [
    {
      keyword: "say",
      mod: true,
      availableInDM: true,
      help: `${SAY_USAGE}: Say something in a channel`,
      execute: say,
    },
    {
      keyword: "presence",
      mod: true,
      availableInDM: true,
      help: `${PRESENCE_USAGE}: Set the bot presence message`,
      execute: presence,
    },
    {
      keyword: "reset",
      helpMod: true,
      availableInDM: true,
      help: "`!reset`: Restart the bot",
      execute: reset,
    },
  ],

  web: (app, bot) => {
    app.get(WEB_ROUTE, bot.utils.requireWebAuth(), auditHandler(bot))
  },
}

function say(bot, message) {
  if (!bot.fromModerator(message)) {
    return
  }

  const channel = message.mentions.channels.first()

  const text = message.content
    .split(" ")
    .slice(2)
    .join(" ")

  if (!channel || !text.length) {
    message.reply(SAY_USAGE)
    return
  }

  channel.send(text)
}

function presence(bot, message, activity, ...words) {
  if (!bot.fromModerator(message)) {
    return
  }

  if (!activity || !words || !words.length) {
    message.reply(PRESENCE_USAGE)
    return
  }

  if (!ACTIVITIES.includes(activity)) {
    message.reply(
      "Activity must be one of playing, streaming, listening or watching",
    )
  }

  bot.client.user.setPresence({
    game: { name: words.join(" "), type: activity.toUpperCase() },
  })
}

function reset(bot, message) {
  if (!bot.fromModerator(message)) {
    return
  }

  message
    .reply("Coming back!")
    .then(() => bot.client.destroy())
    .then(() => process.exit())
}

function auditHandler(bot) {
  return (req, res) => {
    bot.log(`WEB ${WEB_ROUTE}`)

    bot.db
      .all("SELECT * FROM log ORDER BY date DESC")
      .then(results =>
        Promise.all(
          results.map(r => ({
            ...r,
            user: (() => {
              const member = bot.findMember(r.userId)
              return member ? member.displayName : `deleted user (${r.userId})`
            })(),
            message: [
              r.command,
              ...JSON.parse(r.arguments).map(arg =>
                arg
                  .replace(/^<@(\d+)>/, (_, id) => {
                    const member = bot.findMember(id)
                    return `<mark>@${member ? member.displayName : id}</mark>`
                  })
                  .replace(/^<#(\d+)>/, (_, id) => {
                    const channel = bot.guild.channels.find(c => c.id === id)
                    return `<mark>#${channel ? channel.name : id}</mark>`
                  }),
              ),
            ].join(" "),
            channel: bot.client.channels.find(c => c.id === r.location),
          })),
        ),
      )
      .then(log => res.render("audit", { log }))
  }
}
