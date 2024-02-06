import { PermissionFlagsBits } from "discord.js"
import { pick } from "../utils.js"

export default function deploy(bot) {
  return {
    name: "deploy",
    description: "🤖 Update available commands and permissions",
    availability: bot.AVAILABILITY.BOT_MASTER,

    async execute(interaction) {
      const { commands, guild } = bot

      const commandList = [...commands.values()]

      // Create commands, private by default
      await guild.commands.set(
        commandList.map((command) => ({
          ...pick(command, ["name", "description", "options"]),
          defaultMemberPermissions:
            command.availability === bot.AVAILABILITY.PUBLIC
              ? PermissionFlagsBits.UseApplicationCommands
              : 0,
        })),
      )

      await interaction.reply("🤖 Commands deployed!")
    },
  }
}
