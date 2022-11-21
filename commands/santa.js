import {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js"

import { createEmbed } from "../utils.js"
import { getUserLetter, submitLetter, updateLetter } from "../helpers/santa.js"
import { DISCORD_COLORS } from "../logger.js"

const REGIONS = ["na", "eu", "any"]

export default function santa(bot) {
  return {
    name: "santa",
    description: "Take part in our annual Secret Santa!",
    availability: bot.AVAILABILITY.PUBLIC,

    async execute(interaction) {
      const userLetter = await getUserLetter(bot, interaction.user)

      const modal = new ModalBuilder()
        .setCustomId("secret-santa")
        .setTitle("Secret Santa submission")

      const regionComponent = new TextInputBuilder()
        .setCustomId("region")
        .setLabel("Your region")
        .setPlaceholder("NA/EU/ANY")
        .setStyle(TextInputStyle.Short)
        .setValue(userLetter?.region ?? "")

      const postCountComponent = new TextInputBuilder()
        .setCustomId("post-count")
        .setLabel("Your post count")
        .setStyle(TextInputStyle.Short)
        .setValue(userLetter?.postCount ? String(userLetter.postCount) : "")

      const addressComponent = new TextInputBuilder()
        .setCustomId("address")
        .setLabel("Your address")
        .setStyle(TextInputStyle.Paragraph)
        .setValue(userLetter?.address ?? "")

      const contentComponent = new TextInputBuilder()
        .setCustomId("content")
        .setLabel("Your letter")
        .setStyle(TextInputStyle.Paragraph)
        .setValue(userLetter?.content ?? "")

      modal.addComponents(
        new ActionRowBuilder().addComponents(regionComponent),
        new ActionRowBuilder().addComponents(postCountComponent),
        new ActionRowBuilder().addComponents(addressComponent),
        new ActionRowBuilder().addComponents(contentComponent)
      )

      await interaction.showModal(modal)

      const modalSubmit = await interaction.awaitModalSubmit({
        filter: (interaction) => interaction.customId === "secret-santa",
        time: 5 * 60 * 1000, // 5 minutes
      })

      await processModalSubmit(bot, modalSubmit, userLetter)
    },
  }
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
