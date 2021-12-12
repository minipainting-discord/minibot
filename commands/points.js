import { getCurrentScore, getLifetimeScore } from "../helpers/points.js"

export default function points(bot) {
  return {
    name: "points",
    description: "Show your or another user's points",
    availability: bot.AVAILABILITY.PUBLIC,
    options: [
      {
        name: "user",
        description: "An optional user to show points for",
        type: "USER",
      },
    ],

    async execute(interaction) {
      const userArg = interaction.options.getUser("user")
      const user = userArg || interaction.user

      const currentScore = await getCurrentScore(bot, user)
      const lifetimeScore = await getLifetimeScore(bot, user)

      const score = {
        current: currentScore?.points || 0,
        lifetime: lifetimeScore?.points || 0,
      }

      interaction.reply(
        userArg
          ? `${user} has ${score.lifetime} lifetime points and ${score.current} current points`
          : `${user}, you have ${score.lifetime} lifetime points and ${score.current} current points`
      )
    },
  }
}
