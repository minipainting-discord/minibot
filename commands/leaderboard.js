import { createEmbed, getCurrentYear } from "../utils.js"

export default function leaderboard(bot) {
  return {
    name: "leaderboard",
    description: "Display the current leaderboard status",
    availability: bot.AVAILABILITY.PUBLIC,

    async execute(interaction) {
      await interaction.deferReply()

      const { data: currentLeaderboard } = await bot.db
        .from("leaderboard")
        .select()
        .limit(10)
        .order("points", { ascending: false })
        .eq("year", getCurrentYear())

      const { data: lifetimeLeaderboard } = await bot.db
        .from("lifetime")
        .select()
        .limit(10)
        .order("points", { ascending: false })

      const currentDigits = digits(
        currentLeaderboard.reduce(
          (max, line) => (line.points > max ? line.points : max),
          0
        )
      )

      const lifetimeDigits = digits(
        lifetimeLeaderboard.reduce(
          (max, line) => (line.points > max ? line.points : max),
          0
        )
      )

      const maxDigits = Math.max(currentDigits, lifetimeDigits)

      console.log(lifetimeLeaderboard, currentLeaderboard)

      // TODO: Add the web leaderboard
      const embed = createEmbed({
        fields: [
          {
            name: "Lifetime Leaderboard",
            value: defaultMessage(
              lifetimeLeaderboard
                .map(
                  (line) =>
                    `\`${String(line.points).padStart(maxDigits)}\` <@${
                      line.userId
                    }>`
                )
                .join("\n")
            ),
          },
          {
            name: "Current Leaderboard",
            value: defaultMessage(
              currentLeaderboard
                .map(
                  (line) =>
                    `\`${String(line.points).padStart(maxDigits)}\` <@${
                      line.userId
                    }>`
                )
                .join("\n")
            ),
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

function defaultMessage(leaderboardMessage) {
  return leaderboardMessage.length > 0 ? leaderboardMessage : "Empty"
}

function digits(n) {
  return 1 + Math.floor(Math.log10(n))
}
