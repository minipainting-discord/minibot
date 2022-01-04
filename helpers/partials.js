export async function complete(...partialStructures) {
  await Promise.all(
    partialStructures.map(async (partialStructure) => {
      if (partialStructure.partial) {
        await partialStructure.fetch()
      }
    })
  )
}
