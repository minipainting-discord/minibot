export async function getManagedRoleFromOptions(bot, role) {
  const { data: managedRole } = await bot.db
    .from("managedRoles")
    .select()
    .eq("roleId", role.id)
    .single()

  if (!managedRole) {
    return null
  }

  return role
}
