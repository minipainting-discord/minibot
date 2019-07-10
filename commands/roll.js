const DiceExpression = require("dice-expression-evaluator")

module.exports = {
  keyword: "roll",
  help: "`!roll dice_expression`: Roll some dice!",
  execute: (bot, message, ...args) => {
    const textExpression = args.join(" ")

    try {
      const diceExpression = new DiceExpression(textExpression)

      for (const dice of diceExpression.dice) {
        if (dice.diceCount > 50) {
          message.reply("My claws are not so big!")
          return
        }
      }

      const roll = diceExpression.roll()

      const reply = [
        roll.diceRaw.map(subRoll => `(${subRoll.join(", ")})`).join(", "),
        "=>",
        roll.roll,
      ].join(" ")

      if (reply.length > 2000) {
        message.reply("Discord won't handle my power, try with fewer dice!")
        return
      }

      message.reply(reply)
    } catch (error) {
      message.reply(`I can't roll that ${bot.emojis.whut}`)
      bot.logError(error)
    }
  },
}
