const settings = require("../settings.json")

const INTERVAL = 4 * 60 * 60 * 1000

module.exports = {
  name: "critique-cop",
  onReady,
}

function onReady(bot) {
  let previousMessage

  async function sendReminder() {
    if (previousMessage) {
      previousMessage.delete()
    }

    previousMessage = await bot.client.channels.cache
      .get(settings.channels.critique)
      .send(
        "_(Automatic Message)_ **PLEASE READ THE PINNED RULES BEFORE POSTING**",
      )

    setTimeout(sendReminder, INTERVAL)
  }

  // Set first reminder
  const next = new Date()
  next.setHours(next.getHours() + (4 - (next.getHours() % 4)))
  next.setMinutes(0)
  next.setSeconds(0)
  const initialDelay = next - Date.now()

  setTimeout(sendReminder, initialDelay)
}
