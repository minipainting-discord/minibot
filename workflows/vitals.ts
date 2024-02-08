import { Bot } from "../bot"
import { pick } from "../utils"

export default async function vitals(bot: Bot) {
  // Make sure the deploy command is available
  const deployCommand = bot.commands.get("deploy")

  if (!deployCommand) {
    bot.logger.fatal("workflow/vitals", "Unable to find the deploy command")
  }

  await bot.guild.commands.create({
    ...pick(deployCommand, ["name", "description"]),
    defaultMemberPermissions: "0",
  })

  // TODO: Implement OAuth2 flow to be able to do this
  // await bot.guild.commands.permissions.add({
  //   command: guildDeployCommand,
  //   token: bot.env.DISCORD_API_TOKEN,
  //   permissions: [
  //     {
  //       id: bot.env.BOT_MASTER_ID,
  //       type: ApplicationCommandPermissionType.User,
  //       permission: true,
  //     },
  //   ],
  // })
}
