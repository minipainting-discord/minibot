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
          defaultPermission: command.availability === bot.AVAILABILITY.PUBLIC,
        })),
      )

      // TODO: Discord has discontinued setting command permissions for bots
      // We'll be able to only specify if normal members can use them or not
      // but we need to wait for a new discord.js (>13.7.0) version to support
      // it
      //
      // Earlier:
      // const guildCommands = await guild.commands.set(...)
      //
      // const fullPermissions = commandList
      //   .map((command) => {
      //     const permissions = resolvePermissions(bot, command.availability)
      //     const guildCommand = guildCommands.find(
      //       (c) => c.name === command.name
      //     )
      //
      //     return {
      //       id: guildCommand.id,
      //       permissions,
      //     }
      //   })
      //   .filter(({ permissions }) => Boolean(permissions))
      //
      // if (fullPermissions.length > 0) {
      //   await guild.commands.permissions.set({ fullPermissions })
      // }

      await interaction.reply("🤖 Commands deployed!")
    },
  }
}

// function resolvePermissions(bot, availability = bot.AVAILABILITY.PUBLIC) {
//   const { id: atEveryoneId } = bot.guild.roles.cache.find(
//     (role) => role.name === "@everyone"
//   )
//
//   const resolved = [
//     {
//       id: bot.settings.botMasterId,
//       type: "USER",
//       permission: true,
//     },
//   ]
//
//   const roleIdMap = {
//     [bot.AVAILABILITY.PUBLIC]: atEveryoneId,
//     [bot.AVAILABILITY.MOD]: bot.roles.mod.id,
//     [bot.AVAILABILITY.ADMIN]: bot.roles.admin.id,
//   }
//
//   if (roleIdMap[availability]) {
//     resolved.push({
//       id: roleIdMap[availability],
//       type: "ROLE",
//       permission: true,
//     })
//   }
//
//   return resolved
// }
