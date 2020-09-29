const settings = require("../settings.json")

// const INACTIVITY_THRESHOLD = 10 * 1000 // For testing
const INACTIVITY_THRESHOLD = 30 * 60 * 1000

module.exports = {
  name: "critique-cop",
  onReady,
  filter,
}

function onReady(bot) {
  const critiqueCop = {
    sendReminder() {
      bot.client.channels.cache
        .get(settings.channels.critique)
        .send("**PLEASE READ THE PINNED RULES BEFORE POSTING**")
    },
    setReminder() {
      critiqueCop.lastCritiqueTimeout = setTimeout(
        critiqueCop.sendReminder,
        INACTIVITY_THRESHOLD,
      )
    },
    lastCritiqueTimeout: null,
  }

  critiqueCop.sendReminder()
  bot.data.set("critiqueCop", critiqueCop)
}

function filter(bot, message) {
  if (message.channel.id !== settings.channels.critique) {
    return false
  }
  const { setReminder, lastCritiqueTimeout } = bot.data.get("critiqueCop")

  if (lastCritiqueTimeout) {
    clearTimeout(lastCritiqueTimeout)
  }
  setReminder()
}
