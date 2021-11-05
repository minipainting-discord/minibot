const settings = require("../settings.json")
const probeImageSize = require("probe-image-size")
const SQL = require("sql-template-strings")
const sortBy = require("lodash/sortBy")

const WEB_ROUTE = "/gallery"
const WEB_THUMB_WIDTH = 250
const CDN_HOST = "cdn.discordapp.com"
const RESIZER_HOST = "media.discordapp.net"
const waitingUsers = []

module.exports = {
  name: "gallery",
  setup: (bot) =>
    bot.db.run(
      `CREATE TABLE IF NOT EXISTS pictures (
         id TEXT PRIMARY KEY,
         userId TEXT,
         url TEXT,
         description TEXT,
         width INTEGER,
         height INTEGER,
         date TEXT
       )`,
    ),
  filter,
  web,
}

function filter(bot, message) {
  if (message.channel.id !== settings.channels.gallery) {
    return false
  }

  if (message.attachments.size == 0) {
    return false
  }

  const authorId = message.author.id

  if (waitingUsers.includes(authorId)) return true
  waitingUsers.push(authorId)

  message.channel
    .awaitMessages((m) => m.attachments.size > 0 && m.author.id == authorId, {
      time: 30e3,
    })
    .then(async (collected) => {
      const idx = waitingUsers.indexOf(authorId)
      waitingUsers.splice(idx, 1)

      const messages = [message, ...Array.from(collected.values())]
      const attachments = messages.reduce(
        (a, m) => [...a, ...Array.from(m.attachments.values())],
        [],
      )

      bot.log(
        `[gallery] Received ${attachments.length} pictures from ${message.author.username} [${message.id}]`,
      )

      await savePictures(bot, message, attachments)
    })

  return false
}

function web(app, bot) {
  app.get(WEB_ROUTE, async (req, res) => {
    bot.log(`WEB ${WEB_ROUTE}`)

    await bot.guild.members.fetch()

    const userId = req.query.user

    if (userId) {
      const picturesQuery = await bot.db.all(
        SQL`SELECT * FROM pictures WHERE userId = ${userId}`,
      )
      const pictures = picturesQuery.map((picture) => {
        const thumbHeight = Math.round(
          (WEB_THUMB_WIDTH * picture.height) / picture.width,
        )

        return {
          ...picture,
          thumbUrl:
            picture.url.replace(CDN_HOST, RESIZER_HOST) +
            `?width=${WEB_THUMB_WIDTH}&height=${thumbHeight}`,
        }
      })
      return res.render("gallery", {
        user: {
          avatarURL: () => "",
          ...(await bot.findMember(userId)),
        },
        pictures,
        WEB_ROUTE,
      })
    }

    const postingUsers = await bot.db.all(
      SQL`SELECT userId FROM pictures GROUP BY userId`,
    )

    const users = sortBy(
      await Promise.all(
        postingUsers.map(async (user) => await bot.findMember(user.userId)),
      ),
      ["displayName"],
    ).filter(Boolean)

    res.render("gallery", {
      users,
      WEB_ROUTE,
    })
  })
}

async function savePictures(bot, message, attachments) {
  try {
    const values = await Promise.all(
      attachments.map(async (attachment) => {
        const imageSize = await probeImageSize(attachment.url)
        const { width, height } = imageSize
        return SQL`(${attachment.id}, ${message.author.id}, ${attachment.url}, ${message.content}, ${width}, ${height}, datetime('now'))`
      }),
    )
    const baseInsert = SQL`INSERT OR REPLACE INTO pictures (id, userId, url, description, width, height, date) VALUES`
    const query = values.reduce((a, e, i) => {
      return i === values.length - 1 ? a.append(e) : a.append(e).append(", ")
    }, baseInsert)

    await bot.db.run(query)
    bot.log(
      `[gallery] Saved ${attachments.length} pictures for ${message.author.username}`,
    )
  } catch (error) {
    bot.logError(error, "[gallery] Error while saving to database")
  }
}
