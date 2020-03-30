const pool = require('@pool');
const logger = require('@logger');

module.exports.run = async (bot, msg, args) => {
	if(args[0].length > 3) return msg.reply('Le prefix ne peut excéder 5 caractères.');
	await pool.query('UPDATE "Guilds" SET prefix = $1 WHERE guild_id = $2', [args[0], msg.guild.id]);
	bot.prefix.delete(msg.guild.id);
	bot.prefix.set(msg.guild.id,args[0]);
	msg.reply(`Le prefix **${args[0]}** a été défini pour le serveur **${msg.guild.name}**`);
	logger(`Le prefix du serveur $c{magenta:${msg.guild.name}}} a été modifié pour $c{magenta:${args[0]}}}`);
}

module.exports.config = {
	name: "setprefix",
	description : "Set the guild prefix.",
	usage: "!setprefix <prefix>",
	accessibility: ["owner"],
	aliases: ["prefix","setp","sprefix"]
}