const pool = require('@pool');
const isMemberMentioned = require('@struct/mention');

module.exports.run = async (bot, msg, args) => {
	let clan_host = await pool.query('SELECT clan_id FROM "ClanUser" WHERE user_id IN (SELECT id FROM "Users" WHERE user_id = $1 AND guild_id = $2) AND rank IN (\'leader\')',
		[msg.author.id, msg.guild.id]);
	//Vérifier si inviteur est leader de l'escouade
	if(clan_host.rowCount < 1) return msg.reply(`Vous n'êtes pas leader de l'escouade.`);
	let u = isMemberMentioned.run(msg,args,bot);
	if(!u) return msg.reply(`Plusieurs utilisateurs correspondent à l'argument **${args[0]}** veuillez préciser.`);
	let user = u[0];
	let updated_user = await pool.query('UPDATE "ClanUser" SET rank = \'admin\' WHERE user_id IN (SELECT id FROM "Users" WHERE user_id = $1 AND guild_id = $2) AND rank IN (\'member\') RETURNING *',
		[user.id, msg.guild.id]);
	if(updated_user.rowCount > 0) return msg.reply(`**${user.username}** a été promu admin de l'escouade.`);
	msg.reply(`Impossible de promouvoir **${user.username}** au rang d'admin.`);
}


module.exports.config = {
	name: "clanaddadmin",
	description : "Add an admin to your clan.",
	usage: "clanaddadmin <user>",
	accessibility: ["skill",12,5],
	aliases: ["caddadmin","caadmin"]
}