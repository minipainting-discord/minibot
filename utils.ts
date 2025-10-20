import { EmbedBuilder, Message } from "discord.js"

export function digits(n: number): number {
  return 1 + Math.floor(Math.log10(n))
}

export function pick<T extends Record<string, unknown>, K extends keyof T>(
  source: T,
  keys: readonly K[],
) {
  return Object.fromEntries(keys.map((key) => [key, source[key]])) as Pick<T, K>
}

export function partition<T>(array: T[], criteria: (item: T) => boolean) {
  return array.reduce(
    (partitions: [T[], T[]], item: T) => (
      partitions[criteria(item) ? 0 : 1].push(item), partitions
    ),
    [[], []],
  )
}

// Creates an embed and set its default color.
export function createEmbed(
  data: ConstructorParameters<typeof EmbedBuilder>[0],
) {
  return new EmbedBuilder(data).setColor("#BD62F0")
}

// Returns a random integer between min and max, both inclusive
export function randomInt(min: number, max: number) {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Returns a random item from a collection
export function randomItem<T>(collection: T[]) {
  return collection[randomInt(0, collection.length - 1)]
}

// Returns a new array with shuffled elements
export function shuffle<T>(collection: T[]) {
  return collection
    .map((a) => ({ sort: Math.random(), value: a }))
    .sort((a, b) => a.sort - b.sort)
    .map((a) => a.value)
}

// Return the current full year
export function getCurrentYear() {
  return new Date().getFullYear()
}

// Return the previous year
export function getPreviousYear() {
  return getCurrentYear() - 1
}

// Simple pluralize function
export function pluralize(
  word: string,
  count: number,
  plural: string = word + "s",
) {
  return count === 1 ? word : plural
}

// Removes a reaction from a Discord message
export async function removeReaction(message: Message, reaction: string) {
  const existingReaction = message.reactions.cache.get(reaction)

  if (existingReaction) {
    await existingReaction.remove()
  }
}
