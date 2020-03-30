const database = require('@database');
const pool = require('@pool');

module.exports.run = async (bot, msg, args) => {
	await pool.query('SELECT clan_id FROM "ClanUser" WHERE user_id IN (SELECT id FROM "Users" WHERE user_id = $1 AND guild_id = $2)', [msg.author.id, msg.guild.id])
	.then(result => {
		if(result.rowCount > 0) return msg.reply(`Tu es déjà membre d'une escouade, quitte la avant de pouvoir en créer une.`);
		if(args.length < 1) return msg.reply(`Veuillez donner un nom à votre escouade.`);
		if(args.join(' ').length > 25) return msg.reply(`Le nom de l'escouade ne peut excéder 25 caractères.`);
		msg.reply(args.join(' '));
		database.createClan(msg, msg.author, args.join(' '));
	});
}


module.exports.config = {
	name: "clancreate",
	description : "Create a clan.",
	usage: "clancreate <nom du clan>",
	accessibility: ["owner"],
	aliases: ["ccreate"]
}