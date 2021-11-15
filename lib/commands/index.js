import { Collection } from "discord.js"

import { omit, importSiblingModules } from "../utils.js"

export const Permission = {
  PUBLIC: "public",
  MOD: "mod",
  ADMIN: "admin",
}

export async function registerCommands(bot) {
  const { guild } = bot
  bot.logger.info("Registering commands...")

  const commandList = (await importSiblingModules(import.meta.url)).filter(
    Boolean
  )

  // Create commands, private by default
  const guildCommands = await guild.commands.set(
    commandList.map((command) => ({
      ...omit(command, ["execute", "public"]),
      defaultPermission: false,
    }))
  )

  // Update commands permissions
  const fullPermissions = commandList
    .map((command) => {
      const permissions = resolvePermissions(bot, command.permissions)
      const guildCommand = guildCommands.find((c) => c.name === command.name)

      return {
        id: guildCommand.id,
        permissions,
      }
    })
    .filter(({ permissions }) => Boolean(permissions))

  if (fullPermissions.length > 0) {
    await guild.commands.permissions.set({ fullPermissions })
  }

  bot.commands = new Collection(
    commandList.map((command) => [command.name, command])
  )

  bot.logger.info(
    `Enabled commands: ${commandList.map((c) => c.name).join(", ")}`
  )
}

function resolvePermissions(bot, permissions = []) {
  const { id: atEveryoneId } = bot.guild.roles.cache.find(
    (role) => role.name === "@everyone"
  )

  const roleIdMap = {
    [Permission.PUBLIC]: atEveryoneId,
    [Permission.MOD]: bot.roles.mod.id,
    [Permission.ADMIN]: bot.roles.admin.id,
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
