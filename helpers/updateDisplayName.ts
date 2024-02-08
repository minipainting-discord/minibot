import { GuildMember } from "discord.js"
import { Bot } from "../bot"
import { updateUser } from "../models/User"

const LOG_SCOPE = "helper/updateDisplayName"

async function updateDisplayName(bot: Bot, guildMember: GuildMember) {
  try {
    await updateUser(bot.db, guildMember.id, {
      displayName: guildMember.displayName,
    })
  } catch (error) {
    bot.logger.error(LOG_SCOPE, "Error while updating user", error)
  }
}

export { updateDisplayName }
