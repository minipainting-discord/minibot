const basicAuth = require("express-basic-auth")
const settings = require("./settings.json")

// Returns a random integer between min and max, both inclusive
function randomInt(min, max) {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Returns a random item from a collection
function randomItem(collection) {
  return collection[randomInt(0, collection.length - 1)]
}

// Returns a new array with shuffled elements
function shuffle(collection) {
  const copy = [...collection]

  return collection.reduce((shuffled) => {
    const randomIndex = randomInt(0, copy.length - 1)
    return [...shuffled, copy.splice(randomIndex, 1).pop()]
  }, [])
}

function requireWebAuth() {
  return basicAuth({
    users: { minipainting: settings.webPassword },
    challenge: true,
    realm: "minipainting",
    unauthorizedResponse: () => "SKREEEOOOONK!!!",
  })
}

function pluralize(word, count, plural = null) {
  return count === 1 ? word : plural || word + "s"
}

function isCommandAllowed(bot, command, channelId) {
  const { channels } = bot.settings

  if (command.mod && channelId !== channels.mod) {
    return false
  }

  if (command.allowAnywhere) {
    return true
  }

  if (channelId === channels.botcoms) {
    return true
  }

  if (command.allowIn && command.allowIn.includes(channelId)) {
    return true
  }

  return false
}

module.exports = {
  randomInt,
  randomItem,
  shuffle,
  requireWebAuth,
  pluralize,
  isCommandAllowed,
}
