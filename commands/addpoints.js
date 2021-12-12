import { getCurrentScore, getLifetimeScore } from "../helpers/points.js"
import { getCurrentYear } from "../utils.js"

export default function addpoints(bot) {
  return {
    name: "addpoints",
    description: "Add points to an user",
    availability: bot.AVAILABILITY.MOD,
    options: [
      {
        name: "user",
        description: "The user to add points to",
        type: "USER",
        required: true,
      },
      {
        name: "points",
        description: "The amount of points to add",
        type: "INTEGER",
        required: true,
      },
    ],

    async execute(interaction) {
      const user = interaction.options.getUser("user")
      const points = interaction.options.getInteger("points")

      const userId = user.id
      const year = getCurrentYear()

      const currentScore = await getCurrentScore(bot, user)
      const lifetimeScore = await getLifetimeScore(bot, user)

      const newScore = {
        current: (currentScore?.points || 0) + points,
        lifetime: (lifetimeScore?.points || 0) + points,
      }

      if (currentScore) {
        await bot.db
          .from("leaderboard")
          .update({ points: newScore.current })
          .match({ userId, year })
      } else {
        await bot.db.from("leaderboard").insert({ userId, year, points })
      }

      interaction.reply(
        `${user} now has ${newScore.current} current points and ${newScore.lifetime} lifetime points`
      )

      bot.events.emit(bot.EVENT.PLAYER_SCORE_UPDATE, { ...newScore, user })
    },
  }
}
