const logger = require('@logger');

module.exports.run = async (bot, msg, args) => {
	//return msg.reply('In dev...');

	switch (args[0]) {
		case 'command':
			if(!args[1]) return msg.reply('Veuillez spécifier une commande.');
			if(!args[2]) return msg.reply('Veuillez spécifier le dossier de la commande.');
			const commandName = args[1];
			if(!bot.commands.has(commandName.toLowerCase())) return msg.reply('Cette commande n\'existe pas.');
			bot.commands.delete(commandName.toLowerCase());
			let pull;
			if(args[2].toLowerCase() === 'base') {
				delete require.cache[require.resolve(`@root/_commands/${commandName}.js`)];
				pull = require(`@root/_commands/${commandName}.js`);
			}else {
				delete require.cache[require.resolve(`@root/_commands/${args[2]}/${commandName}.js`)];
				pull = require(`@root/_commands/${args[2]}/${commandName}.js`);
			}
			bot.commands.set(commandName.toLowerCase(), pull);
			logger(`La commande $c{blue:${commandName}}} a été rechargée.`);
			msg.reply(`La commande **${commandName}** a été rechargée.`);
			break;
		case 'event':
			if(!args[1]) return msg.reply('Veuillez spécifier un event.');
			const eventName = args[1];
			delete require.cache[require.resolve(`@root/_events/${eventName}.js`)];
			let event = require(`@root/_events/${eventName}.js`);
			bot.on(eventName, event.bind(null, bot));
			logger(`L'event $c{blue:${eventName}}} a été rechargé.`);
			msg.reply(`L'event **${eventName}** a été rechargé.`);
			break;
		default:
			msg.reply('Erreur de synthaxe.');
			break;
	}

	/*if(!args || args.length < 1) return msg.reply('Veuillez spécifier une commande.');
	const commandName = args[1];
	if(!bot.commands.has(commandName)) return msg.reply('Cette commande n\'existe pas.');
	delete require.cache[require.resolve(`./${commandName}.js`)];
	bot.commands.delete(commandName);
	const pull = require(`./${commandName}.js`);
	bot.commands.set(commandName, pull);
	msg.reply(`La commande **${commandName}** a été rechargée.`);*/

}

module.exports.config = {
	name: "reload",
	description : "Reload a command.",
	usage: "reload <command || event> <command_name || event_name> <command_folder>",
	accessibility: ["owner"],
	aliases: ["rl"]
}