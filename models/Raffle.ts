import { DatabaseClient } from "../database.types"

async function addUserToRaffle(db: DatabaseClient, userId: string) {
  const { error } = await db.from("raffle").upsert({ userId })

  if (error) {
    throw error
  }
}

async function removeUserFromRaffle(db: DatabaseClient, userId: string) {
  const { error } = await db.from("raffle").delete().eq("userId", userId)

  if (error) {
    throw error
  }
}

async function isUserInRaffle(db: DatabaseClient, userId: string) {
  const { data } = await db.from("raffle").select().match({ userId }).single()

  return data !== null
}

export { addUserToRaffle, removeUserFromRaffle, isUserInRaffle }
