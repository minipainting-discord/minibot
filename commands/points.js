import { ApplicationCommandOptionType } from "discord.js"
import { getYearScore, getLifetimeScore } from "../helpers/points.js"
import { getCurrentYear } from "../utils.js"

export default function points(bot) {
  return {
    name: "points",
    description: "Show your or another user's points",
    availability: bot.AVAILABILITY.PUBLIC,
    options: [
      {
        name: "user",
        description: "An optional user to show points for",
        type: ApplicationCommandOptionType.User,
      },
    ],

    async execute(interaction) {
      const userArg = interaction.options.getUser("user")
      const user = userArg || interaction.user
      const year = getCurrentYear()

      const currentScore = await getYearScore(bot, user, year)
      const lifetimeScore = await getLifetimeScore(bot, user)

      const score = {
        year: currentScore?.points || 0,
        lifetime: lifetimeScore?.points || 0,
      }

      await interaction.reply(
        userArg
          ? `${user} has ${score.lifetime} lifetime points and ${score.year} points for ${year}`
          : `${user}, you have ${score.lifetime} lifetime points and ${score.year} points for ${year}`
      )
    },
  }
}
