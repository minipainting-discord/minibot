import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
} from "discord.js"
import { BotCommandBuilder } from "./index"
import { Bot } from "../bot"
import {
  createManagedRole,
  getManagedRoleFromDiscordRole,
  removeManagedRole,
  updateManagedRole,
} from "../models/ManagedRole"

const LOG_SCOPE = "commands/role-admin"

const command: BotCommandBuilder = function roleAdmin(bot) {
  return {
    name: "role-admin",
    description: "Manage assignable roles",
    availability: bot.AVAILABILITY.MOD,
    options: [
      {
        name: "create",
        description: "🔓 Create a new assignable role",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "name",
            description: "Name of the role to add",
            type: ApplicationCommandOptionType.String,
            required: true,
          },
          {
            name: "description",
            description: "Description of the role to add",
            type: ApplicationCommandOptionType.String,
            required: true,
          },
        ],
      },
      {
        name: "edit",
        description: "🔓 Edit an assignable role's description",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "role",
            description: "The role to edit",
            type: ApplicationCommandOptionType.Role,
            required: true,
          },
          {
            name: "description",
            description: "New description for the role",
            type: ApplicationCommandOptionType.String,
            required: true,
          },
        ],
      },
      {
        name: "remove",
        description: "🔓 Remove an assignable role",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "role",
            description: "The role to remove",
            type: ApplicationCommandOptionType.Role,
            required: true,
          },
        ],
      },
    ],

    async execute(interaction) {
      const command = interaction.options.getSubcommand()

      switch (command) {
        case "create":
          return await createRole(bot, interaction)
        case "edit":
          return await editRole(bot, interaction)
        case "remove":
          return await removeRole(bot, interaction)
      }
    },
  }
}

/**
 * createRole
 */
async function createRole(bot: Bot, interaction: ChatInputCommandInteraction) {
  const name = interaction.options.getString("name", true)
  const description = interaction.options.getString("description", true)
  const createdBy = interaction.user.id

  if (bot.guild.roles.cache.some((role) => role.name === name)) {
    return interaction.reply({
      content: `Role \`${name}\` already exists.`,
      ephemeral: true,
    })
  }

  const newRole = await bot.guild.roles.create({
    name,
    mentionable: true,
    reason: `Role created by ${interaction.user}: ${description}`,
  })

  await createManagedRole(bot.db, {
    roleId: newRole.id,
    name,
    description,
    createdBy,
  })

  await interaction.reply(`Created role ${newRole}.`)
}

/**
 * removeRole
 */
async function removeRole(bot: Bot, interaction: ChatInputCommandInteraction) {
  const role = interaction.options.getRole("role", true)

  const managedRole = await getManagedRoleFromDiscordRole(bot.db, role.id)
  if (!managedRole) {
    return await interaction.reply({
      ephemeral: true,
      content: `Role \`${role.name}\` is not managed by the bot`,
    })
  }

  try {
    const reason = `Role removed by ${interaction.user} using /role-admin remove`
    await removeManagedRole(bot.db, managedRole)
    const guildRole = await bot.guild.roles.fetch(role.id)
    await guildRole?.delete(reason)
    bot.logger.info(LOG_SCOPE, reason)
  } catch (error) {
    const message = `Unable to remove role \`${role.name}\``
    await interaction.reply({ ephemeral: true, content: message })
    return bot.logger.error(LOG_SCOPE, message, error)
  }

  await interaction.reply(`Role \`${role.name}\` removed`)
}

/**
 * editRole
 */
async function editRole(bot: Bot, interaction: ChatInputCommandInteraction) {
  const role = interaction.options.getRole("role", true)
  const description = interaction.options.getString("description", true)

  const managedRole = await getManagedRoleFromDiscordRole(bot.db, role.id)
  if (!managedRole) {
    return await interaction.reply({
      ephemeral: true,
      content: `Role \`${role.name}\` is not managed by the bot`,
    })
  }

  try {
    await updateManagedRole(bot.db, managedRole, description)
  } catch (error) {
    const message = `Unable to update role \`${role.name}\``
    await interaction.reply({ ephemeral: true, content: message })
    return bot.logger.error(LOG_SCOPE, message, error)
  }

  await interaction.reply(
    `Description for \`${role.name}\` changed to: ${description}`,
  )
}

export default command
