// // Create commands, private by default
// await guild.commands.set(
//   commandList.map((command) => ({
//     ...pick(command, ["name", "description", "options"]),
//     defaultPermission: false,
//   }))
// )

// // Update commands permissions
// const fullPermissions = commandList
//   .map((command) => {
//     const permissions = resolvePermissions(bot, command.permissions)
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
//
// function resolvePermissions(bot, permissions = []) {
//   const { id: atEveryoneId } = bot.guild.roles.cache.find(
//     (role) => role.name === "@everyone"
//   )
//
//   const roleIdMap = {
//     [Permission.PUBLIC]: atEveryoneId,
//     [Permission.MOD]: bot.roles.mod.id,
//     [Permission.ADMIN]: bot.roles.admin.id,
//   }
//
//   return [
//     {
//       id: bot.settings.botMasterId,
//       type: "USER",
//       permission: true,
//     },
//     ...permissions.map((permission) => ({
//       id: roleIdMap[permission],
//       type: "ROLE",
//       permission: true,
//     })),
//   ]
// }
//
