const logger = require('@logger');
const fs = require('fs');

module.exports.run = async (bot, msg, args) => {
	msg.reply('**Shutdown...**').then(() => {
		bot.destroy();
		logger('$c{red:SHUTDOWN...}}');
		setTimeout(()=>process.exit(1),1000);
	});
}

module.exports.config = {
	name: "stop",
	description : "Shutdown the bot.",
	usage: "stop",
	accessibility: ["owner"],
	aliases: ["shutdown"]
}