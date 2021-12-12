import { getManagedRoleFromOptions } from "../helpers/roles.js"
import { createEmbed } from "../utils.js"

export default function role(bot) {
  return {
    name: "role",
    description: "Manage your assignable roles",
    availability: bot.AVAILABILITY.PUBLIC,
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
    ],

    async execute(interaction) {
      const command = interaction.options.getSubcommand()

      switch (command) {
        case "list":
          return listRoles(interaction, bot)
        case "join":
          return joinRole(interaction, bot)
        case "leave":
          return leaveRole(interaction, bot)
      }
    },
  }
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
