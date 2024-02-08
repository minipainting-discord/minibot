import Discord from "discord.js"

type PotentiallyPartial =
  | Discord.User
  | Discord.PartialUser
  | Discord.GuildMember
  | Discord.PartialGuildMember
  | Discord.Message
  | Discord.PartialMessage
  | Discord.MessageReaction
  | Discord.PartialMessageReaction

export async function departialize<
  T extends PotentiallyPartial,
  R extends ReturnType<T["fetch"]>,
>(thing: T): Promise<R> {
  if (thing.partial) {
    return (await thing.fetch()) as R
  } else {
    return thing as unknown as R
  }
}
