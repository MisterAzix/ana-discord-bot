const pool = require('@pool');
const isMemberMentioned = require('@struct/mention');

module.exports.run = async (bot, msg, args) => {
	let clan_host = await pool.query('SELECT clan_id FROM "ClanUser" WHERE user_id IN (SELECT id FROM "Users" WHERE user_id = $1 AND guild_id = $2) AND rank IN (\'leader\',\'admin\')',
		[msg.author.id, msg.guild.id]);
	//Vérifier si inviteur >= Admin
	if(clan_host.rowCount < 1) return msg.reply(`Vous n'êtes pas admin de l'escouade.`);
	//Vérifier mode de l'escouade
	let clan = await pool.query('SELECT mode FROM "Clans" WHERE id = $1',
		[clan_host.rows[0].clan_id]);
	if(clan.rows[0].mode === 0) return msg.reply(`L'escouade est ouverte tu n'as pas besoin d'inviter un membre.`);
	if(clan.rows[0].mode === 2) return msg.reply(`L'escouade est fermée tu ne peux pas inviter un membre.`);
	//Vérifier si invité n'a pas de clan
	let u = isMemberMentioned.run(msg,args,bot);
	if(!u) msg.reply(`Plusieurs utilisateurs correspondent à l'argument **${args[0]}** veuillez préciser.`);
	let user = u[0];
	let clan_guest = await pool.query('SELECT clan_id FROM "ClanUser" WHERE user_id IN (SELECT id FROM "Users" WHERE user_id = $1 AND guild_id = $2) AND rank NOT IN (\'invited\')',
		[user.id, msg.guild.id]);
	if(clan_guest.rowCount > 0) return msg.reply(`**${user.username}** est déjà membre d'une escouade.`);
	//Inviter le membre
	await pool.query('INSERT INTO "ClanUser" (user_id, clan_id, rank) VALUES ((SELECT id FROM "Users" WHERE user_id = $1 AND guild_id = $2),$3,$4) ON CONFLICT ON CONSTRAINT "ClanUser_unique" DO NOTHING RETURNING *',
		[user.id, msg.guild.id, clan_host.rows[0].clan_id, "invited"])
	.then(r => {
		if(r.rowCount > 0) {
			msg.reply(`**${user.username}** a été invité dans l'escouade.`);
			setTimeout(async()=>await pool.query('DELETE FROM "ClanUser" WHERE user_id IN (SELECT id FROM "Users" WHERE user_id = $1 AND guild_id = $2) AND clan_id = $3 AND rank = \'invited\'', 
				[user.id, msg.guild.id, clan_host.rows[0].clan_id]),3600000);
		}else msg.reply(`**${user.username}** a déjà été invité dans l'escouade.`);
	});
}


module.exports.config = {
	name: "claninvite",
	description : "Invite somebody to a clan.",
	usage: "claninvite <user>",
	accessibility: ["skill",12,3],
	aliases: ["cinvite"]
}