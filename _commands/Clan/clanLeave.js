const pool = require('@pool');

module.exports.run = async (bot, msg, args) => {
	await pool.query('DELETE FROM "ClanUser" WHERE user_id IN (SELECT id FROM "Users" WHERE user_id = $1 AND guild_id = $2) AND rank NOT IN (\'invited\',\'leader\') RETURNING *', [msg.author.id, msg.guild.id])
	.then(result => {
		if(result.rowCount > 0) return msg.reply(`Vous venez de quitter votre escouade.`);
		else return msg.reply(`Vous ne faite partie d'aucune escouade.`);
	});
}


module.exports.config = {
	name: "clanleave",
	description : "Leave your clan.",
	usage: "clanleave",
	accessibility: ["skill",12,1],
	aliases: ["cleave"]
}