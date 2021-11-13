import { MessageEmbed } from "discord.js"

import { Permission } from "./index.js"

export default {
  name: "ranks",
  description: "Show point system ranks",
  permissions: [Permission.PUBLIC],

  async execute(interaction, bot) {
    const { ranks } = bot

    const embed = new MessageEmbed().setTitle("Ranks").addFields([
      {
        name: "Name",
        value: ranks.map((r) => r.role).join("\n"),
        inline: true,
      },
      {
        name: "Min. points",
        value: ranks.map((r) => r.minPoints).join("\n"),
        inline: true,
      },
    ])

    await interaction.reply({ embeds: [embed] })
  },
}
