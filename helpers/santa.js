export async function getUserLetter(bot, user) {
  const { data } = await bot.db
    .from("santaLetters")
    .select()
    .eq("userId", user.id)
    .single()

  return data
}

export async function submitLetter(bot, user, letter) {
  const { error } = await bot.db.from("santaLetters").insert({
    userId: user.id,
    ...letter,
  })

  if (error) {
    throw new Error(`Unable to submit letter: ${error}`)
  }
}

export async function updateLetter(bot, user, letter) {
  const { error } = await bot.db
    .from("santaLetters")
    .update({
      ...letter,
    })
    .eq("userId", user.id)

  if (error) {
    throw new Error(`Unable to update letter: ${error}`)
  }
}
