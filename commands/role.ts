import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
} from "discord.js"
import { createEmbed } from "../utils"
import { BotCommandBuilder } from "."
import { Bot } from "../bot"
import {
  ManagedRole,
  getManagedRoleFromDiscordRole,
  listManagedRoles,
} from "../models/ManagedRole"

const command: BotCommandBuilder = function role(bot) {
  return {
    name: "role",
    description: "Manage your assignable roles",
    availability: bot.AVAILABILITY.PUBLIC,
    options: [
      {
        name: "list",
        description: "List your current roles and assignable ones",
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: "join",
        description: "List your current roles and assignable ones",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "role",
            description: "The role to join",
            type: ApplicationCommandOptionType.Role,
            required: true,
          },
        ],
      },
      {
        name: "leave",
        description: "List your current roles and assignable ones",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "role",
            description: "The role to leave",
            type: ApplicationCommandOptionType.Role,
            required: true,
          },
        ],
      },
    ],

    async execute(interaction) {
      const command = interaction.options.getSubcommand()

      switch (command) {
        case "list":
          return await listRoles(bot, interaction)
        case "join":
          return await joinRole(bot, interaction)
        case "leave":
          return await leaveRole(bot, interaction)
      }
    },
  }
}

/**
 * listRoles
 */
async function listRoles(bot: Bot, interaction: ChatInputCommandInteraction) {
  if (!interaction.inCachedGuild()) {
    return
  }
  await interaction.deferReply({ ephemeral: true })

  const managedRoles = await listManagedRoles(bot.db)

  if (!managedRoles.length) {
    return await interaction.editReply("There currently are no roles to join")
  }

  const managedRolesIds = managedRoles.map((managedRole) => managedRole.roleId)
  const guildRoles = bot.guild.roles.cache.filter((role) =>
    managedRolesIds.includes(role.id),
  )

  // Partition guildRoles in roles joined by the invoking user and available roles
  const [joinedRoles, availableRoles] = managedRoles.reduce(
    ([joinedRoles, availableRoles], role) =>
      interaction.member.roles.cache.has(role.roleId)
        ? [[...joinedRoles, role], availableRoles]
        : [joinedRoles, [...availableRoles, role]],
    [[], []] as [ManagedRole[], ManagedRole[]],
  )

  const listRoles = (roles: ManagedRole[]) =>
    roles
      .map((role) => `${guildRoles.get(role.roleId)} ${role.description}`)
      .join("\n")

  const embeds = []

  if (joinedRoles.length) {
    embeds.push(
      createEmbed({
        title: "Joined roles",
        description: listRoles(joinedRoles).slice(0, 4096),
      }),
    )
  }

  if (availableRoles.length) {
    embeds.push(
      createEmbed({
        title: "Available roles",
        description: listRoles(availableRoles).slice(0, 4096),
      }),
    )
  }

  await interaction.editReply({ embeds })
}

/**
 * joinRole
 */
async function joinRole(bot: Bot, interaction: ChatInputCommandInteraction) {
  if (!interaction.inCachedGuild()) {
    return
  }
  await interaction.deferReply({ ephemeral: true })
  const discordRole = interaction.options.getRole("role", true)

  const role = await getManagedRoleFromDiscordRole(bot.db, discordRole.id)

  if (!role) {
    return interaction.editReply({
      content: `Role ${discordRole} is not managed by the bot.`,
    })
  }

  if (interaction.member?.roles.cache.has(role.roleId)) {
    return interaction.editReply({
      content: `You already have the ${discordRole} role`,
    })
  }

  await interaction.member.roles.add(discordRole)
  await interaction.editReply({
    content: `${interaction.member} added to ${discordRole}`,
  })
}

/**
 * leaveRole
 */
async function leaveRole(bot: Bot, interaction: ChatInputCommandInteraction) {
  if (!interaction.inCachedGuild()) {
    return
  }
  await interaction.deferReply({ ephemeral: true })
  const discordRole = interaction.options.getRole("role", true)

  const role = await getManagedRoleFromDiscordRole(bot.db, discordRole.id)

  if (!role) {
    return interaction.editReply({
      content: `Role ${discordRole} is not managed by the bot.`,
    })
  }

  if (!interaction.member.roles.cache.has(role.roleId)) {
    return interaction.editReply({
      content: `You don't have the ${role} role`,
    })
  }

  await interaction.member.roles.remove(discordRole)
  await interaction.editReply({
    content: `${discordRole} removed from ${interaction.member}`,
  })
}

export default command
