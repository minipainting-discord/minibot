export async function listPendingPointRequests(bot) {
  const { error, data } = await bot.db
    .from("pointRequests")
    .select()
    .eq("cleared", false)

  if (error) {
    throw new Error(`Unable to fetch pending point requests: ${error}`)
  }

  return data
}

export async function getPointRequestFromThread(bot, message) {
  const { data } = await bot.db
    .from("pointRequests")
    .select()
    .eq("requestMessageId", message.id)
    .single()

  return data
}

export async function createPointRequest(bot, message) {
  const { data, error } = await bot.db
    .from("pointRequests")
    .insert({
      userId: message.author.id,
      requestMessageId: message.id,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Unable to open point request: ${error}`)
  }

  return data
}

export async function updatePointRequest(bot, pointRequest, data) {
  await bot.db.from("pointRequests").update(data).eq("id", pointRequest.id)
}
