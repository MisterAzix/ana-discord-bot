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
	let updated_user = await pool.query('UPDATE "ClanUser" SET rank = \'member\' WHERE user_id IN (SELECT id FROM "Users" WHERE user_id = $1 AND guild_id = $2) AND rank IN (\'admin\') RETURNING *',
		[user.id, msg.guild.id]);
	if(updated_user.rowCount > 0) return msg.reply(`**${user.username}** a été rétrogradé membre.`);
	msg.reply(`Impossible de rétrogradé **${user.username}** au rang de membre.`);
}


module.exports.config = {
	name: "clandeladmin",
	description : "del an admin from your clan.",
	usage: "clandeladmin <user>",
	accessibility: ["skill",12,5],
	aliases: ["cdeladmin","cdadmin"]
}