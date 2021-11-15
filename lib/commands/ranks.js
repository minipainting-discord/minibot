import { MessageEmbed } from "discord.js"

import { Permission } from "./index.js"

export default {
  name: "ranks",
  description: "Show point system ranks",
  permissions: [Permission.PUBLIC],

  async execute(interaction, bot) {
    const { ranks } = bot

    const maxPointsDigits = Math.floor(
      1 + Math.log10(ranks[ranks.length - 1].minPoints)
    )

    const embed = new MessageEmbed()
      .setTitle("Ranks")
      .setDescription(
        ranks
          .map((rank) =>
            [
              ` \`${String(rank.minPoints).padStart(maxPointsDigits)}\` `,
              rank.role,
            ].join(" ")
          )
          .join("\n")
      )

    await interaction.reply({ embeds: [embed] })
  },
}
