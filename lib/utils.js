import path from "path"
import { fileURLToPath } from "url"
import { readdir } from "fs/promises"
import { MessageEmbed } from "discord.js"

import logger from "./logger.js"

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

  try {
    const modules = await Promise.all(
      modulesToLoad.map(async (moduleToLoad) => {
        const module = await import(moduleToLoad)

        if (!module.default) {
          logger.warn(
            `Ignoring module without default export at ${moduleToLoad}`
          )
          return null
        }

        return module.default
      })
    )

    return modules.filter((m) => m !== null)
  } catch (error) {
    logger.fatal(error)
    throw error
  }
}

export function createEmbed(data) {
  return new MessageEmbed(data).setColor("#BD62F0")
}
