import path from "path"
import { readdir } from "fs/promises"
import { EmbedBuilder } from "discord.js"

export function pick(source, includedKeys) {
  return Object.fromEntries(
    Object.entries(source).filter(([key]) => includedKeys.includes(key))
  )
}

export function partition(array, criteria) {
  return array.reduce(
    (partitions, item) => (
      partitions[criteria(item) ? 0 : 1].push(item), partitions
    ),
    [[], []]
  )
}

export async function importDirectory(directory, logger) {
  const files = await readdir(directory, { withFileTypes: true })

  const modulesToLoad = files
    .filter((file) => !file.isDirectory())
    .map((file) => path.join(process.cwd(), directory, file.name))

  try {
    const modules = await Promise.all(
      modulesToLoad.map(async (moduleToLoad) => {
        const module = await import(moduleToLoad)

        if (!module.default) {
          logger.warn(
            "utils",
            `Ignoring module without default export at ${moduleToLoad}`
          )
          return null
        }

        return module.default
      })
    )

    return modules.filter((m) => m !== null)
  } catch (error) {
    logger.fatal("utils", `Unable to import directory ${directory}`, error)
    throw error
  }
}

export function createEmbed(data) {
  return new EmbedBuilder(data).setColor("#BD62F0")
}

// Returns a random integer between min and max, both inclusive
export function randomInt(min, max) {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Returns a random item from a collection
export function randomItem(collection) {
  return collection[randomInt(0, collection.length - 1)]
}

// Returns a new array with shuffled elements
export function shuffle(collection) {
  const copy = [...collection]

  return collection.reduce((shuffled) => {
    const randomIndex = randomInt(0, copy.length - 1)
    return [...shuffled, copy.splice(randomIndex, 1).pop()]
  }, [])
}

export function getCurrentYear() {
  return new Date().getFullYear()
}

export function pluralize(word, count, plural = word + "s") {
  return count === 1 ? word : plural
}

export async function removeReaction(message, reaction) {
  const existingReaction = message.reactions.cache.get(reaction)

  if (existingReaction) {
    await existingReaction.remove()
  }
}
