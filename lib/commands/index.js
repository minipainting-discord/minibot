import { Collection } from "discord.js"

import { omit, importSiblingModules } from "../utils.js"

export async function registerCommands(bot) {
  const { guild } = bot

  const commandList = (await importSiblingModules(import.meta.url)).filter(
    Boolean
  )

  // Create commands, private by default
  const commandData = commandList.map((command) => ({
    ...omit(command, ["execute", "public"]),
    defaultPermission: true,
  }))
  await guild.commands.set(commandData)

  // // Update commands permissions
  // const fullPermissions = commandList
  //   .map((command) => {
  //     const permissions = [
  //       {
  //         id: settings.ownerId,
  //         type: "USER",
  //         permission: true,
  //       },
  //       command.public && {
  //         id: atEveryoneId,
  //         type: "ROLE",
  //         permission: true,
  //       },
  //     ].filter(Boolean)
  //
  //     const guildCommand = guildCommands.find((c) => c.name === command.name)
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

  bot.commands = new Collection(
    commandList.map((command) => [command.name, command])
  )

  bot.logger.info(
    `Enabled commands: ${commandList.map((c) => c.name).join(", ")}`
  )
}
