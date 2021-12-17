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
      const guildCommands = await guild.commands.set(
        commandList.map((command) => ({
          ...pick(command, ["name", "description", "options"]),
          defaultPermission: false,
        }))
      )

      // Update commands permissions
      const fullPermissions = commandList
        .map((command) => {
          const permissions = resolvePermissions(bot, command.permissions)
          const guildCommand = guildCommands.find(
            (c) => c.name === command.name
          )

          return {
            id: guildCommand.id,
            permissions,
          }
        })
        .filter(({ permissions }) => Boolean(permissions))

      if (fullPermissions.length > 0) {
        await guild.commands.permissions.set({ fullPermissions })
      }

      await interaction.reply("🤖 Commands deployed!")
    },
  }
}

function resolvePermissions(bot, permissions = []) {
  const { id: atEveryoneId } = bot.guild.roles.cache.find(
    (role) => role.name === "@everyone"
  )

  const roleIdMap = {
    [bot.AVAILABILITY.PUBLIC]: atEveryoneId,
    [bot.AVAILABILITY.MOD]: bot.roles.mod.id,
    [bot.AVAILABILITY.ADMIN]: bot.roles.admin.id,
  }

  return [
    {
      id: bot.settings.botMasterId,
      type: "USER",
      permission: true,
    },
    ...permissions.map((permission) => ({
      id: roleIdMap[permission],
      type: "ROLE",
      permission: true,
    })),
  ]
}
