module.exports = {
  name: "audit",
  web: (app, bot) => {
    app.get("/audit", (req, res) => {
      if (!(bot.settings.adminPassword in req.query)) {
        return res.status(401).send("SKREEEOOOONK!!!")
      }

      const guild = bot.client.guilds.first()

      bot.db
        .all("SELECT * FROM log ORDER BY date DESC")
        .then(results =>
          Promise.all(
            results.map(r => ({
              ...r,
              user: guild.members.find(u => u.id === r.userId).displayName,
              message: [
                r.command,
                ...JSON.parse(r.arguments).map(arg =>
                  arg.replace(
                    /^<@(\d+)>/,
                    (_, id) =>
                      `<mark>${
                        guild.members.find(u => u.id === id).displayName
                      }</mark>`,
                  ),
                ),
              ].join(" "),
              channel: bot.client.channels.find(c => c.id === r.location),
            })),
          ),
        )
        .then(log => res.render("audit", { log }))
    })
  },
}
