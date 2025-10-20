import Discord, { GatewayIntentBits, Partials } from "discord.js"

export function createDiscordClient() {
  return new Discord.Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.GuildMember],
  })
}
