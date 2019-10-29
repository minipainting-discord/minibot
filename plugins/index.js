const fs = require("fs")
const path = require("path")

const plugins = fs
  .readdirSync(__dirname)
  .filter(f => f !== "index.js")
  .map(f => require(path.join(__dirname, f)))

module.exports = plugins
