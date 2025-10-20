import { Database, DatabaseClient } from "../database.types"

type User = {
  userId: string
  rankId: number | null
  displayName: string
  canParticipateInSecretSanta: boolean
}

type DBUser = Database["public"]["Tables"]["users"]["Row"]

function User(dbUser: DBUser): User {
  return {
    ...dbUser,
    canParticipateInSecretSanta: Boolean(dbUser.canParticipateInSecretSanta),
  }
}

async function getUserById(
  db: DatabaseClient,
  userId: string,
): Promise<User | null> {
  const { data } = await db.from("users").select().match({ userId }).single()

  return data ? User(data) : null
}

async function updateUser(
  db: DatabaseClient,
  userId: string,
  update: Partial<User> & Pick<User, "displayName">,
): Promise<void> {
  const { error } = await db.from("users").upsert({
    userId: userId,
    ...update,
  })

  if (error) {
    throw error
  }
}

export { getUserById, updateUser }
export type { User }
