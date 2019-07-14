// Returns a random integer between min and max, both inclusive

function randomInt(min, max) {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomItem(collection) {
  return collection[randomInt(0, collection.length - 1)]
}

module.exports = {
  randomInt,
  randomItem,
}
