import { ApplicationCommandOptionType } from "discord.js"
import { shuffle } from "../utils.js"

const DEADLINE = "Dec 14th"

const REGIONS = ["na", "eu", "any"]

const FLAGS = {
  na: "🇺🇸",
  eu: "🇪🇺",
  any: "🌏",
}

const TIERS = {
  nice: "🧝",
  naughty: "🦌",
}

const NICE_THRESHOLD = 3500

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
    ],

    async execute(interaction) {
      if (interaction.member.id !== bot.settings.botMasterId) {
        return interaction.reply({
          content: "Only 🎅 can use this command!",
          ephemeral: true,
        })
      }

      const command = interaction.options.getSubcommand()

      switch (command) {
        case "list":
          return await listParticipants(interaction, bot)
        case "match":
          return await matchParticipants(interaction, bot)
        case "send":
          return await sendMatcheesToParticipants(interaction, bot)
      }
    },
  }
}

async function listParticipants(interaction, bot) {
  const { data: letters } = await bot.db.from("santaLetters").select()

  if (!letters?.length) {
    return interaction.reply({ content: ":shrug:", ephemeral: true })
  }

  const groups = groupLetters(letters)

  const groupedLetters = [
    ...groups.naughty.eu,
    ...groups.naughty.na,
    ...groups.naughty.any,
    ...groups.nice.eu,
    ...groups.nice.na,
    ...groups.nice.any,
  ]

  return interaction.reply({
    content: [
      groupedLetters
        .map(
          (letter) =>
            `${FLAGS[letter.region]} ${TIERS[getTier(letter)]} <@${
              letter.userId
            }> ${letter.matcheeId ? `(🎅 <@${letter.matcheeId}>)` : ""}`
        )
        .join("\n"),
    ].join("\n"),
    ephemeral: true,
  })
}

async function matchParticipants(interaction, bot) {
  await interaction.deferReply({ ephemeral: true })
  const { data: letters } = await bot.db.from("santaLetters").select()
  const groups = groupLetters(letters)

  // If someone is alone in naughty/region, move it to nice
  for (const region of REGIONS) {
    if (groups.naughty[region].length === 1) {
      const letter = groups.naughty[region].pop()
      groups.nice[region].push(letter)
      bot.logger.info(
        "commands/santa-admin",
        `Upgraded user <@${letter.userId}> to the nice tier`
      )
    }
  }

  // Matching dance!
  for (const tier of ["naughty", "nice"]) {
    for (const region of REGIONS) {
      const group = groups[tier][region]
      const shuffledGroup = shuffle(group)

      for (const [i, letter] of shuffledGroup.entries()) {
        const matchee = shuffledGroup[(i + 1) % shuffledGroup.length]
        await bot.db
          .from("santaLetters")
          .update({ matcheeId: matchee.userId })
          .eq("userId", letter.userId)
      }
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
    await dmChannel.send(`>>> ${letter.content}`)
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

function getTier(letter) {
  return letter.postCount >= NICE_THRESHOLD ? "nice" : "naughty"
}

function groupLetters(letters) {
  const groups = {
    naughty: { na: [], eu: [], any: [] },
    nice: { na: [], eu: [], any: [] },
  }

  for (const letter of letters) {
    groups[getTier(letter)][letter.region].push(letter)
  }

  return groups
}
