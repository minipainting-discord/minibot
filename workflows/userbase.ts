import { isBefore, subWeeks } from "date-fns"
import { departialize } from "../helpers/departialize"
import { updateDisplayName } from "../helpers/updateDisplayName"
import { Bot } from "../bot"
import { GuildMember, PartialGuildMember } from "discord.js"

export default async function userbase(bot: Bot) {
  bot.discord.on("guildMemberAdd", onGuildMemberAdd)
  bot.discord.on("guildMemberUpdate", onGuildMemberUpdate)

  async function onGuildMemberAdd(guildMember: GuildMember) {
    bot.logger.info("userbase", `New member: ${guildMember.displayName}`)
    await updateDisplayName(bot, guildMember)

    if (isSuspiciousUser(guildMember)) {
      bot.logger.warn(
        "userbase",
        `Suspicious new member: ${guildMember.displayName}`,
      )
    }
  }

  async function onGuildMemberUpdate(
    partialOldGuildMember: GuildMember | PartialGuildMember,
    newGuildMember: GuildMember,
  ) {
    const oldGuildMember = await departialize(partialOldGuildMember)

    if (oldGuildMember.displayName === newGuildMember.displayName) {
      return
    }

    bot.logger.info(
      "userbase",
      `Rename ${oldGuildMember.displayName} to ${newGuildMember.displayName}`,
    )

    await updateDisplayName(bot, newGuildMember)
  }
}

function isSuspiciousUser(guildMember: GuildMember) {
  const { user } = guildMember

  const now = new Date()
  const isAtLeastOneWeekOld = isBefore(user.createdAt, subWeeks(now, 1))
  const isSystemUser = user.system

  if (isAtLeastOneWeekOld || isSystemUser) {
    return false
  }

  return true
}
