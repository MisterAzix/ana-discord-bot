const pool = require('@pool');
const logger = require('@logger');

module.exports.run = async (bot, msg, args) => {
	if(args[0].length !== 18) return msg.reply('Veuillez renseigner l\'id du rôle de base');
	await pool.query('UPDATE "Guilds" SET base_role = $1 WHERE guild_id = $2', [args[0], msg.guild.id]);
	msg.reply(`Le rôle de base a été défini pour le serveur **${msg.guild.name}**`);
	logger(`Base role have been set for $c{magenta:${args[0]}}}`);
}

module.exports.config = {
	name: "setbaserole",
	description : "Set the guild base role.",
	usage: "!setbaserole <baserole_id>",
	accessibility: ["owner"],
	aliases: ["baserole","setbr","sbaserole"]
}