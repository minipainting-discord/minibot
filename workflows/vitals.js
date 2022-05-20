import { pick } from "../utils.js"

export default async function vitals(bot) {
  // Make sure the deploy command is available
  const deployCommand = bot.commands.get("deploy")
  await bot.guild.commands.create({
    ...pick(deployCommand, ["name", "description"]),
    defaultPermission: false,
  })

  // TODO: Discord has discontinued setting command permissions for bots We'll
  // be able to only specify if normal members can use them or not but we need
  // to wait for a new discord.js (>13.7.0) version to support it
  // await guildDeployCommand.permissions.add({
  //   permissions: [
  //     {
  //       id: bot.settings.botMasterId,
  //       type: "USER",
  //       permission: true,
  //     },
  //   ],
  // })
}
