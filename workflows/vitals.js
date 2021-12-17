import { pick } from "../utils.js"

export default async function vitals(bot) {
  // Make sure the deploy command is available
  const deployCommand = bot.commands.get("deploy")
  const guildDeployCommand = await bot.guild.commands.create({
    ...pick(deployCommand, ["name", "description"]),
    defaultPermission: false,
  })

  await guildDeployCommand.permissions.add({
    permissions: [
      {
        id: bot.settings.botMasterId,
        type: "USER",
        permission: true,
      },
    ],
  })
}
