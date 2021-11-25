import { createEmbed, getCurrentYear } from "../utils.js"

import { Permission } from "./index.js"

export default {
  name: "leaderboard",
  description: "Display the current leaderboard status",
  permissions: [Permission.MOD, Permission.ADMIN],

  async execute(interaction, bot) {
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

    // TODO: Add the web leaderboard
    const embed = createEmbed({
      fields: [
        {
          name: "Lifetime Leaderboard",
          value: lifetimeLeaderboard
            .map(
              (line) =>
                `\`${String(line.points).padStart(lifetimeDigits)}\` <@${
                  line.userId
                }>`
            )
            .join("\n"),
        },
        {
          name: "Current Leaderboard",
          value: currentLeaderboard
            .map(
              (line) =>
                `\`${String(line.points).padStart(currentDigits)}\` <@${
                  line.userId
                }>`
            )
            .join("\n"),
        },
      ],
    })

    interaction.reply({ embeds: [embed] })
  },
}

function digits(n) {
  return 1 + Math.floor(Math.log10(n))
}
