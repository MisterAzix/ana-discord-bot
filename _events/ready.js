const loop = require('@struct/loop.js');
const auth = require('@struct/auth.js');
const count = require('@struct/count.js');
const logger = require('@logger');

module.exports = async (bot) => {
	logger(`$c{magenta:${bot.user.username}}} connected to $c{magenta:${bot.guilds.size}}} guilds.`);
	bot.user.setActivity(`${bot.users.size} réfugiés !`, { type: 'WATCHING' })
	setInterval(() => {
		bot.user.setActivity(`${bot.users.size} réfugiés !`, { type: 'WATCHING' });
	},60000);
	//let activities = [`${bot.users.size} réfugiés !`], i = 0;
	//setInterval(() => bot.user.setActivity(`${activities[i++ % activities.length]}`, { type: 'WATCHING' },30000));
	//bot.user.setActivity(`${bot.users.size} réfugiés !`, { type: 'WATCHING' });
	setTimeout(()=>init(bot),1000);
}

function init(bot) {
	loop.run(bot);
	auth.run(bot);
	count.run(bot);
}