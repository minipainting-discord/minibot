const sizeOf = require("image-size")
const resizeImg = require("resize-img")
const ja = require("jpeg-autorotate")
const { Canvas, Image } = require("canvas")

const MAX_HEIGHT = 1000

function sumWidths(items) {
  return items.reduce((total, item) => total + item.width, 0)
}

module.exports = function(buffers) {
  return Promise.all(
    buffers.map(buffer =>
      ja
        .rotate(buffer, { quality: 85 }) // Automatically rotate JPEGs based on orientation
        .catch(error => ({ buffer })) // Ignore rotate fails
        .then(({ buffer }) => {
          const size = sizeOf(buffer)
          const ratio = MAX_HEIGHT / size.height
          const width = Math.round(ratio * size.width)
          const height = MAX_HEIGHT
          return new Promise((resolve, reject) =>
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
