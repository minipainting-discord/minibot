const Discord = require("discord.js")
const { Canvas } = require("canvas")
const settings = require("../settings.json")

const { channels } = settings

const COLOR_USAGE = {
  COMPLEMENT: "`!color complement COLOR`",
}

module.exports = {
  name: "color",
  commands: [
    {
      keyword: "color",
      help: [
        "`!color NUMBER`: Get one or many random colors",
        `${COLOR_USAGE.COMPLEMENT}: Get a complementary color`,
      ],
      availableInDM: true,
      execute: color,
      allowIn: [channels.general, channels.vc],
    },
  ],
}

async function color(bot, message, ...args) {
  const command = args.shift()

  switch (command) {
    case "complement":
      colorComplement(bot, message, ...args)
      break
    case "scheme":
      colorScheme(bot, message, ...args)
      break
    default:
      colorWithCount(bot, message, command)
  }
}

function colorComplement(bot, message, ...args) {
  const color = args[0]

  if (!color || !color.match(/^#[0-9a-fA-F]{6}$/)) {
    return message.reply(COLOR_USAGE.COMPLEMENT)
  }

  const parsed = parseInt(color.slice(1), 16)
  const complement = 0xffffff - parsed

  const canvas = new Canvas(2 * 28 + 4, 28)
  const ctx = canvas.getContext("2d")
  ctx.fillStyle = color
  ctx.fillRect(0, 0, 28, 28)
  ctx.fillStyle = toHex(complement)
  ctx.fillRect(32, 0, 28, 28)

  const attachment = new Discord.MessageAttachment(
    canvas.toBuffer(),
    "complement.png",
  )

  message.reply(
    `Complement to \`${color}\` is \`${toHex(complement)}\``,
    attachment,
  )
}

function colorScheme(bot, message, ...args) {}

function colorWithCount(bot, message, arg) {
  const count = Math.min(8, Number(arg || 1))

  if (isNaN(count)) {
    return message.reply("Duh, that doesn't look like a number.")
  }

  const colors = Array.from({ length: count }, randomColor)

  const canvas = new Canvas(count * 28 + (count - 1) * 4, 28)
  const ctx = canvas.getContext("2d")

  colors.forEach((color, i) => {
    ctx.fillStyle = toHex(color)
    const xOffset = i * 32
    ctx.fillRect(xOffset, 0, 28, 28)
  })

  const attachment = new Discord.MessageAttachment(
    canvas.toBuffer(),
    "colors.png",
  )

  message.reply(colors.map((c) => `\`${toHex(c)}\``).join(", "), attachment)
}

function randomHex() {
  return Math.floor(Math.random() * 256)
}

function randomColor() {
  return (randomHex() << 16) + (randomHex() << 8) + randomHex()
}

function toHex(color) {
  return "#" + color.toString(16).padStart(6, "0")
}
