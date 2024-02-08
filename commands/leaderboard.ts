import { BotCommandBuilder } from "."
import {
  Score,
  getLifetimeLeaderboard,
  getYearLeaderboard,
} from "../models/Score"
import { createEmbed, digits, getCurrentYear } from "../utils"

const command: BotCommandBuilder = function leaderboard(bot) {
  return {
    name: "leaderboard",
    description: "Display the current leaderboard status",
    availability: bot.AVAILABILITY.PUBLIC,

    async execute(interaction) {
      await interaction.deferReply()

      const currentLeaderboard = await getYearLeaderboard(
        bot.db,
        getCurrentYear(),
      )
      const lifetimeLeaderboard = await getLifetimeLeaderboard(bot.db)

      const maxDigits = digits(
        Math.max(
          ...currentLeaderboard.map((s) => s.points),
          ...lifetimeLeaderboard.map((s) => s.points),
        ),
      )

      const embed = createEmbed({
        fields: [
          {
            name: "Lifetime Leaderboard",
            value: formatLeaderboard(lifetimeLeaderboard, maxDigits),
          },
          {
            name: "Current Leaderboard",
            value: formatLeaderboard(currentLeaderboard, maxDigits),
          },
        ],
      })

      await interaction.editReply({
        content:
          "See the full leaderboard at https://minipainting.art/leaderboard",
        embeds: [embed],
      })
    },
  }
}

function formatLeaderboard(leaderboard: Score[], maxDigits: number) {
  return defaultMessage(
    leaderboard.map((score) => formatScore(score, maxDigits)).join("\n"),
  )
}

function formatScore(score: Score, maxDigits: number) {
  return `\`${String(score.points).padStart(maxDigits)}\` <@${score.userId}>`
}

function defaultMessage(leaderboardMessage: string) {
  return leaderboardMessage.length > 0 ? leaderboardMessage : "No data"
}

export default command
