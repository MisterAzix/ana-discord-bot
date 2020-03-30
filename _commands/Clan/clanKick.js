const pool = require('@pool');
const isMemberMentioned = require('@struct/mention');

module.exports.run = async (bot, msg, args) => {
	let clan_host = await pool.query('SELECT clan_id FROM "ClanUser" WHERE user_id IN (SELECT id FROM "Users" WHERE user_id = $1 AND guild_id = $2) AND rank IN (\'leader\',\'admin\')',
		[msg.author.id, msg.guild.id]);
	//Vérifier si inviteur >= Admin
	if(clan_host.rowCount < 1) return msg.reply(`Vous n'êtes pas admin de l'escouade.`);
	let u = isMemberMentioned.run(msg,args,bot);
	if(!u) msg.reply(`Plusieurs utilisateurs correspondent à l'argument **${args[0]}** veuillez préciser.`);
	let user = u[0];
	let deleted_user = await pool.query('DELETE FROM "ClanUser" WHERE user_id IN (SELECT id FROM "Users" WHERE user_id = $1 AND guild_id = $2) AND clan_id = $3 AND rank NOT IN (\'leader\',\'admin\') RETURNING *',
		[user.id, msg.guild.id, clan_host.rows[0].clan_id]);
	if(deleted_user.rowCount > 0) return msg.reply(`**${user.username}** a été exclu de l'escouade.`);
	msg.reply(`Impossible d'exclure **${user.username}** de l'escouade.`);
}


module.exports.config = {
	name: "clankick",
	description : "Kick somebody from a clan.",
	usage: "clankick <user>",
	accessibility: ["skill",12,3],
	aliases: ["ckick"]
}