import { Database, DatabaseClient } from "../database.types"

type DBManagedRole = Database["public"]["Tables"]["managedRoles"]["Row"]

type ManagedRole = {
  id: number
  description: string
  name: string
  roleId: string
  createdBy: string
}

function ManagedRole(dbManagedRole: DBManagedRole): ManagedRole {
  return {
    ...dbManagedRole,
  }
}

async function getManagedRoleFromDiscordRole(
  db: DatabaseClient,
  discordRoleId: string,
) {
  const { data } = await db
    .from("managedRoles")
    .select()
    .eq("roleId", discordRoleId)
    .single()

  return data ? ManagedRole(data) : null
}

async function listManagedRoles(db: DatabaseClient) {
  const { data, error } = await db.from("managedRoles").select()

  if (error) {
    throw error
  }

  return data ? data.map(ManagedRole) : []
}

async function createManagedRole(
  db: DatabaseClient,
  managedRole: Omit<ManagedRole, "id">,
) {
  const { error } = await db.from("managedRoles").insert(managedRole)

  if (error) {
    throw error
  }
}

async function removeManagedRole(db: DatabaseClient, managedRole: ManagedRole) {
  const { error } = await db
    .from("managedRoles")
    .delete()
    .eq("roleId", managedRole.id)

  if (error) {
    throw error
  }
}

async function updateManagedRole(
  db: DatabaseClient,
  managedRole: ManagedRole,
  description: string,
) {
  const { error } = await db
    .from("managedRoles")
    .update({ description })
    .eq("roleId", managedRole.id)

  if (error) {
    throw error
  }
}

export {
  ManagedRole,
  getManagedRoleFromDiscordRole,
  listManagedRoles,
  createManagedRole,
  removeManagedRole,
  updateManagedRole,
}
