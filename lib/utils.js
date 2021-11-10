import path from "path"
import { fileURLToPath } from "url"
import { readdir, stat } from "fs/promises"

export function omit(source, excludedKeys) {
  return Object.fromEntries(
    Object.entries(source).filter(([key]) => !excludedKeys.includes(key))
  )
}

export async function importSiblingModules(importMetaUrl) {
  const callerFilePath = fileURLToPath(importMetaUrl)
  const callerDirPath = path.dirname(callerFilePath)
  const files = await readdir(callerDirPath, { withFileTypes: true })

  const modulesToLoad = files
    .filter(
      (file) =>
        !file.isDirectory() && file.name !== path.basename(callerFilePath)
    )
    .map((file) => path.join(callerDirPath, file.name))

  return await Promise.all(
    modulesToLoad.map(
      async (moduleToLoad) => (await import(moduleToLoad)).default
    )
  )
}
