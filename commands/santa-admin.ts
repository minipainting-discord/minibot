import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
} from "discord.js"
import { partition, shuffle } from "../utils"
import { updateDisplayName } from "../helpers/updateDisplayName"
import { BotCommandBuilder } from "."
import { Bot } from "../bot"
import {
  REGIONS,
  Region,
  SantaLetter,
  allLettersMatched,
  listSantaLetters,
  setMatcheeId,
} from "../models/SantaLetter"

const LOG_SCOPE = "commands/santa-admin"

const DEADLINE = "Nov 30th"

const FLAGS = {
  na: "🇺🇸",
  eu: "🇪🇺",
  any: "🌏",
} as const

const command: BotCommandBuilder = function roleAdmin(bot) {
  return {
    name: "santa-admin",
    description: "Manage Secret Santa",
    availability: bot.AVAILABILITY.MOD,
    options: [
      {
        name: "list",
        description: "🔒 List Secret Santa participants",
        type: ApplicationCommandOptionType.Subcommand,
        options: [],
      },
      {
        name: "match",
        description: "🔒 Do the matching!",
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: "send",
        description: "🔒 Send letters!",
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: "allowlist",
        description: "🔒 Manage allowed users",
        type: ApplicationCommandOptionType.SubcommandGroup,
        options: [
          {
            name: "list",
            description: "🔒 List allowed users",
            type: ApplicationCommandOptionType.Subcommand,
          },
          {
            name: "allow",
            description: "🔒 Allow an user",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: "user",
                description: "The user to allow",
                type: ApplicationCommandOptionType.User,
                required: true,
              },
            ],
          },
          {
            name: "disallow",
            description: "🔒 Disallow an user",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: "user",
                description: "The user to disallow",
                type: ApplicationCommandOptionType.User,
                required: true,
              },
            ],
          },
          {
            name: "forget",
            description: "🔒 Forget an user",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: "user",
                description: "The user to forget",
                type: ApplicationCommandOptionType.User,
                required: true,
              },
            ],
          },
        ],
      },
    ],

    async execute(interaction) {
      const subcommandGroup = interaction.options.getSubcommandGroup()
      const subcommand = interaction.options.getSubcommand()

      switch (subcommandGroup) {
        case "allowlist":
          switch (subcommand) {
            case "list":
              return await listAllowedUsers(bot, interaction)
            case "allow":
              return await allowUser(bot, interaction)
            case "disallow":
              return await disallowUser(bot, interaction)
            case "forget":
              return await forgetUser(bot, interaction)
          }
          break
        case null: {
          switch (subcommand) {
            case "list":
              return await listParticipants(bot, interaction)
            case "match":
              return await matchParticipants(bot, interaction)
            case "send":
              return await sendMatcheesToParticipants(bot, interaction)
          }
        }
      }
    },
  }
}

async function listParticipants(
  bot: Bot,
  interaction: ChatInputCommandInteraction,
) {
  const letters = await listSantaLetters(bot.db)

  if (!letters.length) {
    return interaction.reply({ content: ":shrug:", ephemeral: true })
  }

  const lettersByRegion = groupLetters(letters)

  const sortedLetters = [
    ...lettersByRegion.eu,
    ...lettersByRegion.na,
    ...lettersByRegion.any,
  ]

  return interaction.reply({
    content: [
      sortedLetters
        .map(
          (letter) =>
            `${FLAGS[letter.region]} <@${letter.userId}> ${
              letter.matcheeId ? `(🎅 <@${letter.matcheeId}>)` : ""
            }`,
        )
        .join("\n"),
    ].join("\n"),
    ephemeral: true,
  })
}

async function matchParticipants(
  bot: Bot,
  interaction: ChatInputCommandInteraction,
) {
  await interaction.deferReply({ ephemeral: true })
  const letters = await listSantaLetters(bot.db)

  if (!letters.length) {
    return interaction.reply({ content: ":shrug:", ephemeral: true })
  }

  const lettersByRegion = groupLetters(letters)

  // Matching dance!
  try {
    for (const region of REGIONS) {
      const group = lettersByRegion[region]
      const shuffledGroup = shuffle(group)

      for (const [i, letter] of shuffledGroup.entries()) {
        const matchee = shuffledGroup[(i + 1) % shuffledGroup.length]
        await setMatcheeId(bot.db, letter.userId, matchee.userId)
      }
    }
  } catch (error) {
    await interaction.editReply({
      content: "There was an error while assigning matchees",
    })
    return bot.logger.error(
      LOG_SCOPE,
      "Error during matchee assignation",
      error,
    )
  }

  return interaction.editReply({
    content: "Matching dance is done!",
  })
}

async function sendMatcheesToParticipants(
  bot: Bot,
  interaction: ChatInputCommandInteraction,
) {
  const letters = await listSantaLetters(bot.db)

  if (!letters.length) {
    return interaction.reply({ content: ":shrug:", ephemeral: true })
  }

  if (allLettersMatched(letters)) {
    return interaction.reply({
      content: "Not everyone is matched! Please match people first.",
      ephemeral: true,
    })
  }

  await interaction.reply("Sending letters!")

  for (const letter of letters) {
    const user = await bot.guild.members.fetch(letter.userId)
    const santa = await bot.guild.members.fetch(letter.matcheeId)
    const dmChannel = await santa.user.createDM()
    await dmChannel.send(
      [
        "Hello dear minipainter,",
        "You volunteered to take part in our annual Secret Santa and we thank you for that!",
        "",
        `I picked a giftee for you and it is **<@${user.id}>**!`,
        "Here is their Santa letter:",
      ].join("\n"),
    )
    for (const message of breakLetterIntoMessages(letter)) {
      await dmChannel.send(`>>> ${message}`)
    }
    await dmChannel.send(
      [
        "Pick at least one item in this list, buy it and send it to this address:",
        letter.address.replace(/^/gm, "> "),
        "You can of course buy more than one item and/or throw in whatever additional gift you think would please that person.",
        "",
        "You also have been picked as a giftee for someone else!",
        "",
        `Last thing, please don't forget to send your package before **${DEADLINE}**.`,
        `For any additional question, please ask <@${bot.env.BOT_MASTER_ID}>!`,
      ].join("\n"),
    )
    bot.logger.info(
      "commands/santa-admin",
      `Sent letter to ${santa.displayName}`,
    )
  }

  await interaction.followUp({ content: "Letters sent! :snowflake: :rocket:" })
}

function breakLetterIntoMessages(letter) {
  return letter.content.split("\n").reduce(
    (messages, line) => {
      const lastMessage = messages.at(-1)
      const withNewLine = lastMessage + line + "\n"
      if (withNewLine.length > 1996) {
        return [...messages, line]
      } else {
        return [...messages.slice(0, messages.length - 1), withNewLine]
      }
    },
    [""],
  )
}

function groupLetters(letters: SantaLetter[]) {
  const byRegion: Record<Region, SantaLetter[]> = { na: [], eu: [], any: [] }

  for (const letter of letters) {
    byRegion[letter.region].push(letter)
  }

  return byRegion
}

async function listAllowedUsers(
  bot: Bot,
  interaction: ChatInputCommandInteraction,
) {
  const { data: users } = await bot.db
    .from("users")
    .select()
    .not("canParticipateInSecretSanta", "is", null)

  if (!users?.length) {
    return interaction.reply({
      content: "No users manually allowed or disallowed yet",
      ephemeral: true,
    })
  }

  const [allow, disallow] = partition(
    users,
    (user) => user.canParticipateInSecretSanta,
  )

  return interaction.reply({
    content: [
      allow.length
        ? `Manually allowed users: ${users
            .map((user) => user.displayName)
            .join(", ")}`
        : null,
      disallow.length
        ? `Manually disallowed users: ${users
            .map((user) => user.displayName)
            .join(", ")}`
        : null,
    ]
      .filter((line) => line !== null)
      .join("\n"),
    ephemeral: true,
  })
}

export async function allowUser(
  bot: Bot,
  interaction: ChatInputCommandInteraction,
) {
  const user = interaction.options.getUser("user")
  const guildMember = await bot.guild.members.fetch(user)
  await updateDisplayName(bot, guildMember)

  const { error } = await bot.db
    .from("users")
    .update({
      canParticipateInSecretSanta: true,
    })
    .eq("userId", user.id)

  if (error) {
    throw new Error("Unable to update user", { cause: error })
  }

  await interaction.reply({
    content: `Allowed user ${user}`,
    ephemeral: true,
  })
}

export async function disallowUser(
  bot: Bot,
  interaction: ChatInputCommandInteraction,
) {
  const user = interaction.options.getUser("user")
  const guildMember = await bot.guild.members.fetch(user)
  await updateDisplayName(bot, guildMember)

  const { error } = await bot.db
    .from("users")
    .update({
      canParticipateInSecretSanta: false,
    })
    .eq("userId", user.id)

  if (error) {
    throw new Error("Unable to update user", { cause: error })
  }

  await interaction.reply({
    content: `Disallowed user ${user}`,
    ephemeral: true,
  })
}

export async function forgetUser(
  bot: Bot,
  interaction: ChatInputCommandInteraction,
) {
  const user = interaction.options.getUser("user")
  const guildMember = await bot.guild.members.fetch(user)
  await updateDisplayName(bot, guildMember)

  const { error } = await bot.db
    .from("users")
    .update({
      canParticipateInSecretSanta: null,
    })
    .eq("userId", user.id)

  if (error) {
    throw new Error("Unable to update user", { cause: error })
  }

  await interaction.reply({
    content: `Forgot user ${user}`,
    ephemeral: true,
  })
}
export default command
