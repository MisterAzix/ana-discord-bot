const pool = require('@pool');

module.exports.run = async (bot, msg, args) => {
	if (args.join(' ').length > 256) return msg.reply('Votre description ne peux pas dépasser 256 caractères.');
	await pool.query('UPDATE "Users" SET description = $1 WHERE user_id = $2 AND guild_id = $3',
		[args.join(' '), msg.author.id, msg.guild.id]);
	msg.reply('Description mise à jour.');
}


module.exports.config = {
	name: "setdescription",
	description : "set your profile description.",
	usage: "setdescription <your description>",
	accessibility: ["skill",8,3],
	aliases: ["setdesc","desc"]
}