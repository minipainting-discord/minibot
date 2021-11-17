import { createEmbed } from "../utils.js"

import { Permission } from "./index.js"

export default {
  name: "role",
  description: "Manage your assignable roles",
  permissions: [Permission.PUBLIC],
  options: [
    {
      name: "list",
      description: "List your current roles and assignable ones",
      type: "SUB_COMMAND",
    },
    {
      name: "join",
      description: "List your current roles and assignable ones",
      type: "SUB_COMMAND",
      options: [
        {
          name: "role",
          description: "The role to join",
          type: "ROLE",
          required: true,
        },
      ],
    },
    {
      name: "leave",
      description: "List your current roles and assignable ones",
      type: "SUB_COMMAND",
      options: [
        {
          name: "role",
          description: "The role to leave",
          type: "ROLE",
          required: true,
        },
      ],
    },
    {
      name: "create",
      description: "Create a new assignable role [MOD ONLY]",
      type: "SUB_COMMAND",
      options: [
        {
          name: "name",
          description: "Name of the role to add",
          type: "STRING",
          required: true,
        },
        {
          name: "description",
          description: "Description of the role to add",
          type: "STRING",
          required: true,
        },
      ],
    },
    {
      name: "remove",
      description: "Remove an assignable role [MOD ONLY]",
      type: "SUB_COMMAND",
      options: [
        {
          name: "role",
          description: "The role to remove",
          type: "ROLE",
          required: true,
        },
      ],
    },
  ],

  async execute(interaction, bot) {
    const command = interaction.options.getSubcommand()

    switch (command) {
      case "list":
        return listRoles(interaction, bot)
      case "join":
        return joinRole(interaction, bot)
      case "leave":
        return leaveRole(interaction, bot)
      case "create":
        return createRole(interaction, bot)
      case "remove":
        return removeRole(interaction, bot)
    }
  },
}

/**
 * listRoles
 */
async function listRoles(interaction, bot) {
  const { data: managedRoles } = await bot.db.from("managedRoles").select()

  if (!managedRoles.length) {
    interaction.reply({
      content: "There currently are no roles to join",
      ephemeral: true,
    })
  }

  const managedRolesIds = managedRoles.map((managedRole) => managedRole.roleId)
  const guildRoles = await bot.guild.roles.cache.filter((role) =>
    managedRolesIds.includes(role.id)
  )

  // Partition guildRoles in roles joined by the invoking user and available roles
  const [joinedRoles, availableRoles] = managedRoles.reduce(
    ([joinedRoles, availableRoles], role) =>
      interaction.member.roles.cache.has(role.roleId)
        ? [[...joinedRoles, role], availableRoles]
        : [joinedRoles, [...availableRoles, role]],
    [[], []]
  )

  const listRoles = (roles) =>
    roles
      .map((role) => `${guildRoles.get(role.roleId)} ${role.description}`)
      .join("\n")

  const embed = createEmbed({
    title: "Self-assignable roles",
  })

  if (joinedRoles.length) {
    embed.addField("**Joined**", listRoles(joinedRoles))
  }

  if (availableRoles.length) {
    embed.addField("**Available**", listRoles(availableRoles))
  }

  interaction.reply({ embeds: [embed], ephemeral: true })
}

/**
 * joinRole
 */
async function joinRole(interaction, bot) {
  const role = await getManagedRoleFromOptions(bot, interaction)

  if (!role) {
    return
  }

  if (interaction.member.roles.cache.has(role.id)) {
    return interaction.reply({
      content: `You already have the ${role} role`,
      ephemeral: true,
    })
  }

  await interaction.member.roles.add(role)
  interaction.reply({ content: `${interaction.member} added to ${role}` })
}

/**
 * leaveRole
 */
async function leaveRole(interaction, bot) {
  const role = await getManagedRoleFromOptions(bot, interaction)

  if (!role) {
    return
  }

  if (!interaction.member.roles.cache.has(role.id)) {
    return interaction.reply({
      content: `You don't have the ${role} role`,
      ephemeral: true,
    })
  }

  await interaction.member.roles.remove(role)
  interaction.reply({ content: `${role} removed from ${interaction.member}` })
}

/**
 * createRole
 */
async function createRole(interaction, bot) {
  if (!bot.isModerator(interaction.member)) {
    throw new bot.PermissionError()
  }

  const name = interaction.options.getString("name")
  const description = interaction.options.getString("description")
  const createdBy = interaction.member.id

  if (bot.guild.roles.cache.some((role) => role.name === name)) {
    return interaction.reply({
      content: `Role \`${name}\` already exists.`,
      ephemeral: true,
    })
  }

  const newRole = await bot.guild.roles.create({
    name,
    mentionable: true,
    reason: `Role created by ${createdBy}: ${description}`,
  })

  await bot.db
    .from("managedRoles")
    .insert({ roleId: newRole.id, name, description, createdBy })

  interaction.reply(`Created role ${newRole}.`)
}

/**
 * removeRole
 */
async function removeRole(interaction, bot) {
  if (!bot.isModerator(interaction.member)) {
    throw new bot.PermissionError()
  }

  const role = await getManagedRoleFromOptions(bot, interaction)

  if (!role) {
    return
  }

  await bot.db.from("managedRoles").delete().eq("roleId", role.id)
  await role.delete()

  interaction.reply(`Role \`${role.name}\` removed`)
}

async function getManagedRoleFromOptions(bot, interaction) {
  const role = interaction.options.getRole("role")

  const { data: managedRole } = await bot.db
    .from("managedRoles")
    .select()
    .eq("roleId", role.id)
    .single()

  if (!managedRole) {
    interaction.reply({
      content: `Role ${role} is not managed by the bot.`,
      ephemeral: true,
    })
  }

  return role
}
