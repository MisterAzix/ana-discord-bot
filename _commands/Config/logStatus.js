const pool = require('@pool');

module.exports.run = async (bot, msg, args) => {
	switch (args[0].toLowerCase()) {
		case 'on':
			await pool.query('UPDATE "Guilds" SET log_channel = $1 WHERE guild_id = $2', [msg.channel.id, msg.guild.id]);
			msg.reply(`Les logs ont été activé dans ce channel.`);
			break;
		case 'off':
			await pool.query('UPDATE "Guilds" SET log_channel = \'0\' WHERE guild_id = $1', [msg.guild.id]);
			msg.reply(`Les logs ont été désactivé.`);
			break;
		default:
			msg.reply(`Erreur dans la syntaxe`);
			break;
	}
}

module.exports.config = {
	name: "logstatus",
	description : "On/Off log",
	usage: "logstatus",
	accessibility: ["owner"],
	aliases: ["lstatus"]
}