const Discord = require("discord.js")
const settings = require("../settings.json")
const http = require("https")
const url = require("url")
const sizeOf = require("image-size")
const resizeImg = require("resize-img")
const ja = require("jpeg-autorotate")
const { Canvas, Image } = require("canvas")

const MAX_HEIGHT = 1000
const waitingUsers = []

module.exports = function(bot, message) {
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
    .then(collected => {
      const idx = waitingUsers.indexOf(authorId)
      waitingUsers.splice(idx, 1)

      const messages = [message, ...Array.from(collected.values())]
      const attachments = messages.reduce(
        (a, m) => [...a, ...Array.from(m.attachments.values())],
        [],
      )
      const images = attachments.slice(0, 3).map(a => a.url)

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
          const botcomsChan = bot.client.channels.get(settings.channels.botcoms)
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
    })

  return null
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
      const canvasHeight = MAX_HEIGHT
      const canvas = new Canvas(canvasWidth, canvasHeight)
      const ctx = canvas.getContext("2d")

      thumbs.forEach((thumb, position) => {
        const offset = sumWidths(thumbs.slice(0, position)) + position * 3
        const img = new Image()
        img.src = thumb.image

        ctx.drawImage(img, offset, 0)
      })

      return canvas.toBuffer()
    })
    .catch(error => console.error(error))
}
