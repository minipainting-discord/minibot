import { ApplicationCommandOptionType } from "discord.js"
import { partition, shuffle } from "../utils.js"
import { updateDisplayName } from "../helpers/userbase.js"

const DEADLINE = "Nov 30th"

const REGIONS = ["na", "eu", "any"]

const FLAGS = {
  na: "🇺🇸",
  eu: "🇪🇺",
  any: "🌏",
}

export default function roleAdmin(bot) {
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
              return await listAllowedUsers(interaction, bot)
            case "allow":
              return await allowUser(interaction, bot)
            case "disallow":
              return await disallowUser(interaction, bot)
            case "forget":
              return await forgetUser(interaction, bot)
          }
          break
        case null: {
          switch (subcommand) {
            case "list":
              return await listParticipants(interaction, bot)
            case "match":
              return await matchParticipants(interaction, bot)
            case "send":
              return await sendMatcheesToParticipants(interaction, bot)
          }
        }
      }
    },
  }
}

async function listParticipants(interaction, bot) {
  const { data: letters } = await bot.db.from("santaLetters").select()

  if (!letters?.length) {
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
            }`
        )
        .join("\n"),
    ].join("\n"),
    ephemeral: true,
  })
}

async function matchParticipants(interaction, bot) {
  await interaction.deferReply({ ephemeral: true })
  const { data: letters } = await bot.db.from("santaLetters").select()
  const lettersByRegion = groupLetters(letters)

  // Matching dance!
  for (const region of REGIONS) {
    const group = lettersByRegion[region]
    const shuffledGroup = shuffle(group)

    for (const [i, letter] of shuffledGroup.entries()) {
      const matchee = shuffledGroup[(i + 1) % shuffledGroup.length]
      await bot.db
        .from("santaLetters")
        .update({ matcheeId: matchee.userId })
        .eq("userId", letter.userId)
    }
  }

  return interaction.editReply({
    content: "Matching dance is done!",
    ephemeral: true,
  })
}

async function sendMatcheesToParticipants(interaction, bot) {
  const { data: letters } = await bot.db.from("santaLetters").select()

  if (!letters?.length) {
    return interaction.reply({ content: ":shrug:", ephemeral: true })
  }

  if (letters.some((letter) => !letter.matcheeId)) {
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
      ].join("\n")
    )
    if (letter.content.length > 1900) {
      await dmChannel.send(
        `>>> ${letter.content.slice(0, Math.floor(letter.length / 2))}`
      )
      await dmChannel.send(
        `>>> ${letter.content.slice(
          Math.floor(letter.length / 2),
          letter.length
        )}`
      )
    } else {
      await dmChannel.send(`>>> ${letter.content}`)
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
        `For any additional question, please ask <@${bot.settings.botMasterId}>!`,
      ].join("\n")
    )
    bot.logger.info(
      "commands/santa-admin",
      `Sent letter to ${santa.displayName}`
    )
  }

  await interaction.followUp({ content: "Letters sent! :snowflake: :rocket:" })
}

function groupLetters(letters) {
  const regions = { na: [], eu: [], any: [] }

  for (const letter of letters) {
    regions[letter.region].push(letter)
  }

  return regions
}

async function listAllowedUsers(interaction, bot) {
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
    (user) => user.canParticipateInSecretSanta
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

export async function allowUser(interaction, bot) {
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

export async function disallowUser(interaction, bot) {
  const user = interaction.options.getUser("user")
  const guildMember = await bot.guild.members.fetch(user)
  await updateDisplayName(bot, guildMember)
  console.log(guildMember)

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

export async function forgetUser(interaction, bot) {
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
