const Discord = require("discord.js")
const settings = require("../settings.json")
const http = require("https")
const url = require("url")
const sizeOf = require("image-size")
const resizeImg = require("resize-img")
const ja = require("jpeg-autorotate")
const SQL = require("sql-template-strings")
const { Canvas, Image } = require("canvas")

const MAX_HEIGHT = 1000
const waitingUsers = []

module.exports = {
  name: "gallery",

  setup: bot =>
    bot.db.run(
      `CREATE TABLE IF NOT EXISTS pictures (
         id TEXT PRIMARY KEY,
         userId TEXT,
         url TEXT,
         description TEXT
       )`,
    ),

  filter(bot, message) {
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
        const idx = waitingUsers.indexOf(authorId)
        waitingUsers.splice(idx, 1)

        const messages = [message, ...Array.from(collected.values())]
        const attachments = messages.reduce(
          (a, m) => [...a, ...Array.from(m.attachments.values())],
          [],
        )

        try {
          const values = attachments.map(
            attachment =>
              SQL`(${attachment.id}, ${message.author.id}, ${attachment.url}, ${message.content})`,
          )
          const baseInsert = SQL`INSERT INTO pictures (id, userId, url, description) VALUES`
          const query = values.reduce((a, e, i) => {
            return i === values.length - 1
              ? a.append(e)
              : a.append(e).append(", ")
          }, baseInsert)

          await bot.db.run(query)
        } catch (error) {
          console.error("[gallery] Error while saving to database", error)
        }

        const images = attachments.slice(0, 6).map(a => a.url)

        Promise.all(
          images.map(
            image =>
              new Promise(resolve => {
                const options = url.parse(image)
                http.get(options, response => {
                  const chunks = []
                  response
                    .on("data", chunk => chunks.push(chunk))
                    .on("end", () => resolve(Buffer.concat(chunks)))
                })
              }),
          ),
        )
          .then(buffers => createCollage(buffers))
          .then(collage => {
            const genChan = bot.client.channels.get(settings.channels.general)
            const botcomsChan = bot.client.channels.get(
              settings.channels.botcoms,
            )
            for (const channel of [genChan, botcomsChan]) {
              if (channel == null) {
                continue
              }

              const attachment = new Discord.Attachment(
                collage,
                "minigalleryimage.png",
              )

              channel
                .send(`${message.author}\n${message.url}`, attachment)
                .catch(bot.logError)
            }
            bot.log(
              `Processed gallery upload from ${message.author.username} [${message.id}]`,
            )
          })
          .catch(bot.logError)
      })

    return null
  },
}

function sumWidths(items) {
  return items.reduce((total, item) => total + item.width, 0)
}

function createCollage(buffers) {
  return Promise.all(
    buffers.map(buffer =>
      ja
        .rotate(buffer, { quality: 85 }) // Automatically rotate JPEGs based on orientation
        .catch(() => ({ buffer })) // Ignore rotate fails
        .then(({ buffer }) => {
          const size = sizeOf(buffer)
          const ratio = MAX_HEIGHT / size.height
          const width = Math.round(ratio * size.width)
          const height = MAX_HEIGHT
          return new Promise(resolve =>
            resizeImg(buffer, { width, height }).then(image =>
              resolve({ width, height, image }),
            ),
          )
        }),
    ),
  )
    .then(thumbs => {
      const canvasWidth = sumWidths(thumbs) + thumbs.length * 3
      const canvasHeight = buffers.length > 3 ? 2 * MAX_HEIGHT : MAX_HEIGHT
      const canvas = new Canvas(canvasWidth, canvasHeight)
      const ctx = canvas.getContext("2d")

      thumbs.forEach((thumb, position) => {
        const y = Math.floor(position / 3)
        const xOffset = sumWidths(thumbs.slice(y * 3, position)) + position * 3
        const yOffset = y * MAX_HEIGHT

        const img = new Image()
        img.src = thumb.image

        ctx.drawImage(img, xOffset, yOffset)
      })

      return canvas.toBuffer()
    })
    .catch(error => console.error(error))
}
