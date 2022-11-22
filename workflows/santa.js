import {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js"

import { createEmbed } from "../utils.js"
import { getUserLetter, submitLetter, updateLetter } from "../helpers/santa.js"
import { DISCORD_COLORS } from "../logger.js"
import { Events } from "discord.js"

const REGIONS = ["na", "eu", "any"]

export default async function santa(bot) {
  bot.discord.on(Events.InteractionCreate, async (interaction) => {
    const userLetter = await getUserLetter(bot, interaction.user)

    if (
      interaction.isModalSubmit() &&
      interaction.customId === "secret-santa-form"
    ) {
      return await processModalSubmit(bot, interaction, userLetter)
    }

    if (
      interaction.isButton() &&
      interaction.customId === "join-secret-santa"
    ) {
      return await processButtonClick(interaction, userLetter)
    }
  })
}

async function processModalSubmit(bot, interaction, previousLetter) {
  await interaction.deferReply({ ephemeral: true })

  const region = interaction.fields
    .getTextInputValue("region")
    .toLowerCase()
    .trim()
  const postCount = interaction.fields.getTextInputValue("post-count").trim()
  const address = interaction.fields.getTextInputValue("address").trim()
  const content = interaction.fields.getTextInputValue("content").trim()

  const errors = []

  if (!REGIONS.some((availableRegion) => availableRegion === region)) {
    errors.push({ name: "Region", value: "Should be one of NA, EU or ANY" })
  }

  if (postCount.length === 0) {
    errors.push({ name: "Post Count", value: "Should not be empty" })
  }

  if (isNaN(Number(postCount))) {
    errors.push({ name: "Post Count", value: "Should be a number" })
  }

  if (address.length === 0) {
    errors.push({ name: "Address", value: "Should not be empty" })
  }

  if (content.length === 0) {
    errors.push({ name: "Letter", value: "Should not be empty" })
  }

  if (errors.length > 0) {
    await interaction.editReply({
      content: "There were some errors when submitting your letter",
      embeds: [
        createEmbed({
          fields: errors,
        }).setColor(DISCORD_COLORS.error),
      ],
      ephemeral: true,
    })
    return
  }

  if (previousLetter) {
    await updateLetter(bot, interaction.user, {
      region,
      postCount: Number(postCount),
      address,
      content,
    })
    await interaction.editReply({
      content: "Your letter has been properly updated!",
      ephemeral: true,
    })
  } else {
    await submitLetter(bot, interaction.user, {
      region,
      postCount: Number(postCount),
      address,
      content,
    })

    await interaction.editReply({
      content:
        "Thanks for joining! I'll notify you when your giftee has been choosed.",
      ephemeral: true,
    })
  }
}

async function processButtonClick(interaction, previousLetter) {
  const modal = new ModalBuilder()
    .setCustomId("secret-santa-form")
    .setTitle("Secret Santa submission")

  const regionComponent = new TextInputBuilder()
    .setCustomId("region")
    .setLabel("Your region")
    .setPlaceholder("NA/EU/ANY")
    .setStyle(TextInputStyle.Short)
    .setValue(previousLetter?.region ?? "")

  const postCountComponent = new TextInputBuilder()
    .setCustomId("post-count")
    .setLabel("Your post count")
    .setStyle(TextInputStyle.Short)
    .setValue(previousLetter?.postCount ? String(previousLetter.postCount) : "")

  const addressComponent = new TextInputBuilder()
    .setCustomId("address")
    .setLabel("Your address")
    .setStyle(TextInputStyle.Paragraph)
    .setValue(previousLetter?.address ?? "")

  const contentComponent = new TextInputBuilder()
    .setCustomId("content")
    .setLabel("Your letter")
    .setStyle(TextInputStyle.Paragraph)
    .setValue(previousLetter?.content ?? "")

  modal.addComponents(
    new ActionRowBuilder().addComponents(regionComponent),
    new ActionRowBuilder().addComponents(postCountComponent),
    new ActionRowBuilder().addComponents(addressComponent),
    new ActionRowBuilder().addComponents(contentComponent)
  )

  await interaction.showModal(modal)
}
