import { Message, ThreadChannel } from "discord.js"
import { Bot } from "../bot"

export async function listPendingPointRequests(bot: Bot) {
  const { error, data } = await bot.db
    .from("pointRequests")
    .select()
    .eq("cleared", false)

  if (error) {
    throw new Error(`Unable to fetch pending point requests: ${error}`)
  }

  return data
}

export async function getPointRequestFromThread(
  bot: Bot,
  threadChannel: ThreadChannel,
) {
  const { data } = await bot.db
    .from("pointRequests")
    .select()
    .eq("requestMessageId", threadChannel.id)
    .single()

  return data
}

export async function createPointRequest(bot: Bot, message: Message) {
  const { data, error } = await bot.db
    .from("pointRequests")
    .insert({
      userId: message.author.id,
      requestMessageId: message.id,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Unable to open point request: ${error}`)
  }

  return data
}

export async function updatePointRequest(bot: Bot, pointRequest, data) {
  await bot.db.from("pointRequests").update(data).eq("id", pointRequest.id)
}
