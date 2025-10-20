import { Database, DatabaseClient } from "../database.types"

const REGIONS = ["na", "eu", "any"] as const

type Region = (typeof REGIONS)[number]

type DBSantaLetter = Database["public"]["Tables"]["santaLetters"]["Row"]

type SantaLetter = {
  userId: string
  address: string
  content: string
  matcheeId: string | null
  region: Region
}

type MatchedSantaLetter = Omit<SantaLetter, "matcheeId"> & {
  matcheeId: string
}

function SantaLetter(dbSantaLetter: DBSantaLetter): SantaLetter {
  return {
    ...dbSantaLetter,
  }
}

async function listSantaLetters(db: DatabaseClient) {
  const { data, error } = await db.from("santaLetters").select()

  if (error) {
    throw error
  }

  return data ? data.map(SantaLetter) : []
}

async function setMatcheeId(
  db: DatabaseClient,
  userId: string,
  matcheeId: string,
) {
  const { error } = await db
    .from("santaLetters")
    .update({ matcheeId: matcheeId })
    .eq("userId", userId)

  if (error) {
    throw error
  }
}

function allLettersMatched(
  letters: SantaLetter[],
): letters is MatchedSantaLetter[] {
  return letters.every((letter) => letter.matcheeId !== null)
}

export {
  SantaLetter,
  REGIONS,
  listSantaLetters,
  setMatcheeId,
  allLettersMatched,
}
export type { Region }

// async function createManagedRole()
