import {
  ApplicationCommandOptionData,
  ChatInputCommandInteraction,
} from "discord.js"
import { AVAILABILITY, Bot } from "../bot"

type BotCommand = {
  name: string
  description: string
  availability: (typeof AVAILABILITY)[keyof typeof AVAILABILITY]
  options?: ApplicationCommandOptionData[]
  execute: (interaction: ChatInputCommandInteraction) => Promise<unknown>
}

type BotCommandBuilder = (bot: Bot) => BotCommand

export { default as addpoints } from "./addpoints"
export { default as deploy } from "./deploy"
export { default as leaderboard } from "./leaderboard"
export { default as points } from "./points"
export { default as raffle } from "./raffle"
export { default as ranks } from "./ranks"
export { default as roleAdmin } from "./role-admin"
export { default as role } from "./role"
export { default as roll } from "./roll"
export { default as santaAdmin } from "./santa-admin"
export { default as santa } from "./santa"
export { default as say } from "./say"

export type { BotCommand, BotCommandBuilder }
