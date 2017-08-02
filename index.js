const Discord = require('discord.js');
const client = new Discord.Client();
const settings = require('./settings.json');
const sql = require('sqlite');

var scoredb = 0;
var accountsdb = 0;

function set_points(message, user, new_points, current_level) {
  let new_level = 0;
  let member = message.guild.member(user);
  let myRole2 = message.guild.roles.find("name", "Dip 'N Forget");
  let myRole3 = message.guild.roles.find("name", "Ebay Propainted");
  let myRole4 = message.guild.roles.find("name", "C+C Plz");
  let myRole5 = message.guild.roles.find("name", "JALMM");
  let myRole6 = message.guild.roles.find("name", "Bub For The Bub Glub");

  if (new_points >= 70) {
    new_level = 5;
    if (current_level != new_level) {
      message.channel.send(
        user +
        ` :confetti_ball: Congratulations you reached **Bub For The Bub Glub** rank! :confetti_ball:`
      );
      member.removeRole(myRole5).catch(console.error);
      member.addRole(myRole6).catch(console.error);
    }
  } else if (new_points >= 40) {
    new_level = 4;
    if (current_level != new_level) {
      message.channel.send(
        user +
        ` :confetti_ball: Congratulations you reached **JALMM** rank! :confetti_ball:`
      );
      member.removeRole(myRole4).catch(console.error);
      member.addRole(myRole5).catch(console.error);
    }
  } else if (new_points >= 20) {
    new_level = 3;
    if (current_level != new_level) {
      message.channel.send(
        user +
        ` :confetti_ball: Congratulations you reached **C+C Plz** rank! :confetti_ball:`
      );
      member.removeRole(myRole3).catch(console.error);
      member.addRole(myRole4).catch(console.error);
    }
  } else if (new_points >= 10) {
    new_level = 2;
    if (current_level != new_level) {
      message.channel.send(
        user +
        ` :confetti_ball: Congratulations you reached **Ebay Pro-Painted** rank! :confetti_ball:`
      );
      member.removeRole(myRole2).catch(console.error);
      member.addRole(myRole3).catch(console.error);
    }
  } else if (new_points >= 5) {
    new_level = 1;
    if (current_level != new_level) {
      message.channel.send(
        user +
        ` :confetti_ball: Congratulations you reached **Dip 'N Forget** rank! :confetti_ball:`
      );
      member.addRole(myRole2).catch(console.error);
    }
  }

  if (current_level != new_level) {
    scoredb.run(
      `UPDATE scores SET points = ${new_points}, level = ${new_level} WHERE userId = ${user.id}`
    );
  } else {
    scoredb.run(
      `UPDATE scores SET points = ${new_points} WHERE userId = ${user.id}`
    );
  }
}

Promise
  .all([
    sql.open('./score.sqlite', {
      Promise
    }),
    sql.open('./accounts.sqlite', {
      Promise
    })
  ])
  .then(function([scoreDB, accountsDB]) {
    scoredb = scoreDB;
    accountsdb = accountsDB;
  });

client.on('ready', () => {
  console.log('I\'m Online\nl\'m Online');
});

var prefix = "!"
var last_user_upload = {};

client.on('message', message => {
  if (message.author.bot)
    return;
  if (message.channel.type !== 'text')
    return;

  if (message.channel.id === "236049686820159488") {

    let can_upload = false;
    let is_link = false;

    if (message.attachments.array().length == 0) {
      let message_text = message.content;
      if (!(message_text.startsWith('https://') || message_text.startsWith(
          'http://') || message_text.startsWith('www'))) {
        message.delete();
        return;
      }
      is_link = true;
    }

    if (message.author.id in last_user_upload) {
      let last_upload = last_user_upload[message.author.id];
      if ((Date().getTime() - last_upload.getTime()) > 10000) {
        last_user_upload[message.author.id] = Date.now();
        can_upload = true;
      }
    } else {
      last_user_upload[message.author.id] = Date.now();
      can_upload = true;
    }

  if (!can_upload)
    return;

  if (is_link) {
    client.channels.get("236042005929656320").sendMessage(message.author +
      ":" + message_text);
    return;
  }


  for (let attachment of message.attachments.values()) {
    if ((/\.(gif|jpe?g|tiff|png)$/i).test(attachment.url)) {
      client.channels.get("236042005929656320")
        .sendFile(attachment.url, attachment.url, message.author);
    }
  }

  var match = message.content.match(
    /(?:[^:/?#\s]+:\/\/)?[^/?#\s]+\/(?:[^?#\s]*\.(?:jpe?g|gif|png))(?:\?[^#\s]*)?(?:#.*)?/ig
  );
  if (!match)
    return;
  for (let url of match) {
    client.channels.get("236042005929656320")
      .sendFile(url, url, message.author);
  }
}

if (!message.content.startsWith(prefix))
  return;

if (message.content.startsWith(prefix + 'addpoints')) {
  console.log(message.mentions.users);
  var user = message.mentions.users.first();
  var number = 0;
  var index = message.content.lastIndexOf(" ");
  if (index !== -1) {
    number = Number(message.content.substring(index + 1));
  }
  let adminRole = message.guild.roles.find("name", "Admin");
  let modRole = message.guild.roles.find("name", "Moderators");

  if (!message.member.roles.has(adminRole.id) && !message.member.roles
    .has(
      modRole.id)) {
    message.reply(
      `:japanese_goblin:  Haha! Being sneaky are we? :japanese_goblin: `
    ).then(msg => {
      msg.delete(10000);
    });
    return;
  }

  let new_points = number;
  let current_level = 0;
  let new_level = 0;

  scoredb.get(`SELECT * FROM scores WHERE userId ='${user.id}'`)
    .then(row => {
      if (!row) {
        scoredb.run(
          'INSERT INTO scores (userId, points, level) VALUES (?, ?, ?)', [
            user.id, 0, 0
          ]);
      } else {
        current_level = row.level;
        new_points += row.points;
        new_level = current_level;
      }

      set_points(message, user, new_points, current_level);
    })
    .catch(() => {
      console.error;
      scoredb
        .run(
          'CREATE TABLE IF NOT EXISTS scores (userId TEXT, points INTEGER, level INTEGER)'
        )
        .then(() => {
          scoredb.run(
            'INSERT INTO scores (userId, points, level) VALUES (?, ?, ?)', [
              user.id, 0, 0
            ]);

          set_points(message, user, new_points, current_level);
        });
    });

} else

if (message.content.startsWith(prefix + 'resetpoints')) {
  var user = message.mentions.users.first();
  var number = 0;

  let myRole1 = message.guild.roles.find("name", "Admin");

  if (!message.member.roles.has(myRole1.id)) {
    message.reply(
      `:japanese_goblin:  Haha! Being sneaky are we? :japanese_goblin: `
    ).then(msg => {
      msg.delete(10000);
    });
    return;
  }

  let member = message.guild.member(user);

  let myRole2 = message.guild.roles.find("name", "Dip 'N Forget");
  let myRole3 = message.guild.roles.find("name", "Ebay Propainted");
  let myRole4 = message.guild.roles.find("name", "C+C Plz");
  let myRole5 = message.guild.roles.find("name", "JALMM");
  let myRole6 = message.guild.roles.find("name",
    "Bub For The Bub Glub");

  if (member.roles.has(myRole2.id)) {
    member.removeRole(myRole2).catch(console.error);
  }

  if (member.roles.has(myRole3.id)) {
    member.removeRole(myRole3).catch(console.error);
  }

  if (member.roles.has(myRole4.id)) {
    member.removeRole(myRole4).catch(console.error);
  }

  if (member.roles.has(myRole5.id)) {
    member.removeRole(myRole5).catch(console.error);
  }

  if (member.roles.has(myRole6.id)) {
    member.removeRole(myRole6).catch(console.error);
  }

  scoredb.get(`SELECT * FROM scores WHERE userId ='${user.id}'`).then(
    row => {
      if (!row) {
        scoredb.run(
          'INSERT INTO scores (userId, points, level) VALUES (?, ?, ?)', [
            user.id, number, 0
          ]);
      } else {
        scoredb.run(
          `UPDATE scores SET points = ${
                                          number
                                        }, level = ${
                                                     number
                                                   } WHERE userId = ${
                                                                      user.id
                                                                    }`
        );
        console.log("points-reset!");
      }
    });

} else

if (message.content.startsWith(prefix + 'points')) {
  var user = message.author;
  if (message.mentions.users.size > 0) {
    user = message.mentions.users.first();
  }
  scoredb.get(`SELECT * FROM scores WHERE userId ='${user.id}'`)
    .then(row => {
      if (!row) {
        return message.reply('Your current points are 0').then(msg => {
          msg.delete(10000);
        });
      }

      return message.reply(
        `Your current points are ${row.points}`).then(msg => {
        msg.delete(10000);
      });
    });
} else

if (message.content.startsWith(prefix + "makers")) {

  message.reply(
    `here's a list of all manufacturers: https://www.reddit.com/r/minipainting/wiki/manufacturers`
  ).then(msg => {
    msg.delete(10000);
  });
} else

if (message.content.startsWith(prefix + "tutorials")) {

  message.reply(
    `here's a compilation of useful guides: https://www.reddit.com/r/minipainting/wiki/tutorials`
  ).then(msg => {
    msg.delete(10000);
  });
} else

if (message.content.startsWith(prefix + "leaderboard")) {
  try {

    scoredb.get(`SELECT TOP 5 * FROM scores order by points desc`)
      .then(table => {
        message.reply(table).then(msg => {
          msg.delete(10000);
        });

      });
  } catch (e) {
    message.reply("Chron broked it.").then(msg => {
      msg.delete(10000);
    });
  }

} else

if (message.content.startsWith(prefix + "help")) {

  message.reply(
    `**COMMAND LIST**\n
		"!points":	You can see you're current experience points!
		"!checkponts [name]":	You can check someones points!
		"!makers":	You can find all mini related manufactores!
		"!tutorials":	You can find useful guide lists!
		"!setredditaccount [username]": You can link your reddit account!
		"!reddit [user]": Get a user's linked reddit account!
		"!setalbum [link]": You can link an album of your paintings!
		"!album [user]": Get a user's linked album!`
  ).then(msg => {
    msg.delete(10000);
  });

} else

if (message.content.startsWith(prefix + "bio_endio")) {

  message.reply(
    `
			C O N T R A S T
			O
			N
			T
			R
			A
			S
			T`).then(
    msg => {
      msg.delete(10000);
    });
} else

if (message.content.startsWith(prefix + "redpiano")) {

  message.reply(`O I L`).then(msg => {
    msg.delete(10000);
  });
} else

if (message.content.startsWith(prefix + "sdub")) {

  message.reply(`https://www.youtube.com/user/SDubist`).then(msg => {
    msg.delete(10000);
  });
} else

if (message.content.startsWith(prefix + "setredditaccount")) {
  let author = message.author;
  let index = message.content.lastIndexOf(" ");
  let redditAccount = "";
  if (index == -1) {
    message.reply('Usage: !setredditaccount [username]').then(msg => {
      msg.delete(10000);
    });
    return;
  }
  redditAccount = message.content.substring(index + 1);
  if (redditAccount.startsWith('https://')) {
    redditAccount = redditAccount.replace('https://', '');
  }
  if (redditAccount.startsWith('http://')) {
    redditAccount = redditAccount.replace('http://', '');
  }
  if (redditAccount.startsWith('www.reddit.com')) {
    redditAccount = redditAccount.replace('www.reddit.com', '');
  }
  if (redditAccount.startsWith('/user/')) {
    redditAccount = redditAccount.replace('/user/', '');
  }

  accountsdb.get(
      `SELECT * FROM accounts WHERE userId ='${author.id}'`)
    .then(row => {
      if (!row) {
        accountsdb.run(
          'INSERT INTO accounts (userId, account, album) VALUES (?, ?, ?)', [
            author.id, redditAccount, ""
          ]);
      } else {
        accountsdb.run(
          `UPDATE accounts SET account = "${
                                                  redditAccount
                                                }" WHERE userId = ${
                                                                    author.id
                                                                  }`
        );
      }
      console.log("set reddit account!");
    })
    .catch(() => {
      console.error;
      accountsdb
        .run(
          'CREATE TABLE IF NOT EXISTS accounts (userId TEXT, account TEXT, album TEXT)'
        )
        .then(() => {
          accountsdb.run(
            'INSERT INTO accounts (userId, account, album) VALUES (?, ?, ?)', [
              author.id, redditAccount, ""
            ]);
        });
    });

  message.reply(
    `Successfully linked to https://www.reddit.com/u/` +
    redditAccount).then(msg => {
    msg.delete(10000);
  });

} else

if (message.content.startsWith(prefix + "reddit")) {

  try {
    var user = message.author;
    if (message.mentions.users.size > 0) {
      user = message.mentions.users.first();
    }
    accountsdb.get(
        `SELECT * FROM accounts WHERE userId ='${user.id}'`)
      .then(row => {
        if (!row || row.account == "") {
          message.reply(user +
            ` does not have a linked Reddit account.`).then(
            msg => {
              msg.delete(10000);
            });
        } else {
          message.reply(`Reddit Account for ` + user +
            `: https://www.reddit.com/user/` + row.account).then(
            msg => {
              msg.delete(10000);
            });
        }
      });
  } catch (e) {
    message.reply('Invalid user').then(msg => {
      msg.delete(10000);
    });
  }
} else

if (message.content.startsWith(prefix + "setalbum")) {
  let author = message.author;
  let index = message.content.lastIndexOf(" ");
  let album = "";
  if (index == -1) {
    message.reply('Usage: !setalbum [link]').then(msg => {
      msg.delete(10000);
    });
    return;
  }
  album = message.content.substring(index + 1);
  if (!album.startsWith('http://') && !album.startsWith(
      'https://')) {
    album = 'http://' + album;
  }

  accountsdb.get(
      `SELECT * FROM accounts WHERE userId ='${author.id}'`)
    .then(row => {
      if (!row) {
        accountsdb.run(
          'INSERT INTO accounts (userId, account, album) VALUES (?, ?, ?)', [
            author.id, "", album
          ]);
      } else {
        accountsdb.run(
          `UPDATE accounts SET album = "${
                                                album
                                              }" WHERE userId = ${author.id}`
        );
      }
      console.log("set album!");
    })
    .catch(() => {
      console.error;
      accountsdb
        .run(
          'CREATE TABLE IF NOT EXISTS accounts (userId TEXT, account TEXT, album TEXT)'
        )
        .then(() => {
          accountsdb.run(
            'INSERT INTO accounts (userId, account, album) VALUES (?, ?, ?)', [
              author.id, "", album
            ]);
        });
    });

  message.reply(`Successfully set album to ` + album).then(msg => {
    msg.delete(10000);
  });
} else

if (message.content.startsWith(prefix + "album")) {
  try {
    var user = message.author;
    if (message.mentions.users.size > 0) {
      user = message.mentions.users.first();
    }
    accountsdb.get(
        `SELECT * FROM accounts WHERE userId ='${user.id}'`)
      .then(row => {
        if (!row || row.album == "") {
          message.reply(user + ` does not have a linked album.`)
            .then(
              msg => {
                msg.delete(10000);
              });
        } else {
          message.reply(`Album for ` + user + `: ` + row.album)
            .then(
              msg => {
                msg.delete(10000);
              });
        }
      });
  } catch (e) {
    message.reply('Invalid user').then(msg => {
      msg.delete(10000);
    });
  }
} else if (message.content.startsWith(prefix + "reset")) {
  let myRole1 = message.guild.roles.find("name", "Admin");

  if (!message.member.roles.has(myRole1.id) && message.author.id !=
    '134744140318638080') {
    return;
  }
  message.reply(`Coming back!`);

  setTimeout(() => {
    process.exit();
  }, 1000);
}
});

client.login(settings.token);
