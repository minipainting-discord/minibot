module.exports = {
  keyword: "ranks",
  help: "`!ranks`: Display the ranks",
  execute: (bot, message) => {
    const reply = [
      "**RANKS**",
      ...bot.ranks.map(
        (rank, index) =>
          `    ${index + 1}. ${rank.name} - ${rank.minPoints}pts`,
      ),
    ].join("\n")
    message.reply(reply)
  },
}
