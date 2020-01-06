const Discord = require("discord.js")
const settings = require("../settings.json")
const http = require("https")
const url = require("url")
const sizeOf = require("image-size")
const probeImageSize = require("probe-image-size")
const resizeImg = require("resize-img")
const ja = require("jpeg-autorotate")
const SQL = require("sql-template-strings")
const { Canvas, Image } = require("canvas")
const sortBy = require("lodash/sortBy")

const WEB_ROUTE = "/gallery"
const MAX_HEIGHT = 1000
const WEB_THUMB_WIDTH = 250
const CDN_HOST = "cdn.discordapp.com"
const RESIZER_HOST = "media.discordapp.net"
const waitingUsers = []

module.exports = {
  name: "gallery",
  setup: bot =>
    bot.db.run(
      `CREATE TABLE IF NOT EXISTS pictures (
         id TEXT PRIMARY KEY,
         userId TEXT,
         url TEXT,
         description TEXT,
         width INTEGER,
         height INTEGER
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
    if (
      ["https://", "http://", "www"].some(prefix =>
        message.content.startsWith(prefix),
      )
    ) {
      for (const channel of [
        settings.channels.general,
        settings.channels.botcoms,
      ]) {
        bot.client.channels
          .get(channel)
          .sendMessage(message.author + " : " + message.content)
      }
    } else {
      message.delete()
    }

    return true
  }

  const authorId = message.author.id

  if (waitingUsers.includes(authorId)) return true

  waitingUsers.push(authorId)

  message.channel
    .awaitMessages(m => m.attachments.size > 0 && m.author.id == authorId, {
      time: 10e3,
    })
    .then(async collected => {
      bot.log(
        `[gallery] Received ${collected.size} pictures from ${message.author.username} [${message.id}]`,
      )
      const idx = waitingUsers.indexOf(authorId)
      waitingUsers.splice(idx, 1)

      const messages = [message, ...Array.from(collected.values())]
      const attachments = messages.reduce(
        (a, m) => [...a, ...Array.from(m.attachments.values())],
        [],
      )

      await savePictures(bot, message, attachments)
      await processPictures(bot, message, attachments)
    })

  return null
}

function web(app, bot) {
  app.get(WEB_ROUTE, async (req, res) => {
    bot.log(`WEB ${WEB_ROUTE}`)

    await bot.guild.fetchMembers()

    const userId = req.query.user

    if (userId) {
      const picturesQuery = await bot.db.all(
        SQL`SELECT * FROM pictures WHERE userId = ${userId}`,
      )
      const pictures = picturesQuery.map(picture => {
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
        user: bot.findMember(userId),
        pictures,
        WEB_ROUTE,
      })
    }

    const postingUsers = await bot.db.all(
      SQL`SELECT userId FROM pictures GROUP BY userId`,
    )

    const users = sortBy(
      postingUsers.map(user => bot.findMember(user.userId)),
      ["displayName"],
    )

    res.render("gallery", {
      users,
      WEB_ROUTE,
    })
  })
}

async function savePictures(bot, message, attachments) {
  try {
    const values = await Promise.all(
      attachments.map(async attachment => {
        const imageSize = await probeImageSize(attachment.url)
        const { width, height } = imageSize
        return SQL`(${attachment.id}, ${message.author.id}, ${attachment.url}, ${message.content}, ${width}, ${height})`
      }),
    )
    const baseInsert = SQL`INSERT OR REPLACE INTO pictures (id, userId, url, description, width, height) VALUES`
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

async function processPictures(bot, message, attachments) {
  const images = attachments.slice(0, 6).map(a => a.url)

  try {
    const buffers = await Promise.all(images.map(async i => downloadImage(i)))
    const collage = await createCollage(buffers)
    const genChan = bot.client.channels.get(settings.channels.general)
    const botcomsChan = bot.client.channels.get(settings.channels.botcoms)

    for (const channel of [genChan, botcomsChan]) {
      if (channel == null) {
        continue
      }

      const attachment = new Discord.Attachment(collage, "minigalleryimage.png")

      await channel.send(`${message.author}\n${message.url}`, attachment)
    }

    bot.log(
      `[gallery] Processed upload from ${message.author.username} [${message.id}]`,
    )
  } catch (error) {
    bot.logError(error)
  }
}

function sumWidths(items) {
  return items.reduce((total, item) => total + item.width, 0)
}

async function createCollage(buffers) {
  const thumbs = await Promise.all(
    buffers.map(async buffer => {
      let image
      try {
        image = await ja.rotate(buffer, { quality: 85 })
      } catch (error) {
        image = buffer
      }

      const size = await probeImageSize.sync(buffer)
      const ratio = MAX_HEIGHT / size.height
      const width = Math.round(ratio * size.width)
      const height = MAX_HEIGHT
      const data = await resizeImg(image, { width, height })

      return {
        width,
        height,
        data,
      }
    }),
  )
  const canvasWidth = sumWidths(thumbs) + thumbs.length * 3
  const canvasHeight = buffers.length > 3 ? 2 * MAX_HEIGHT : MAX_HEIGHT
  const canvas = new Canvas(canvasWidth, canvasHeight)
  const ctx = canvas.getContext("2d")

  thumbs.forEach((thumb, position) => {
    const y = Math.floor(position / 3)
    const xOffset = sumWidths(thumbs.slice(y * 3, position)) + position * 3
    const yOffset = y * MAX_HEIGHT

    const img = new Image()
    img.src = thumb.data

    ctx.drawImage(img, xOffset, yOffset)
  })

  return canvas.toBuffer()
}

function downloadImage(imageUrl) {
  return new Promise(resolve => {
    const options = url.parse(imageUrl)
    http.get(options, response => {
      const chunks = []
      response
        .on("data", chunk => chunks.push(chunk))
        .on("end", () => resolve(Buffer.concat(chunks)))
    })
  })
}
