const pool = require('@pool');
const { RichEmbed } = require('discord.js');

module.exports.run = async (bot, msg, args) => {
	let clan;
	if(!args[0]) {
		clan = await pool.query('SELECT * FROM "Clans" WHERE id IN (SELECT clan_id FROM "ClanUser" WHERE user_id IN (SELECT id FROM "Users" WHERE user_id = $1 AND guild_id = $2))', [msg.author.id, msg.guild.id]);
	}else if(parseInt(args[0])) {
		clan = await pool.query('SELECT * FROM "Clans" WHERE id = $1', [parseInt(args[0])]);
	}else {
		clan = await pool.query('SELECT * FROM "Clans" WHERE name ILIKE $1', [args.join(' ')]);
	}
	if(clan.rowCount < 1) return msg.reply(`Aucune escouade du nom de **${args.join(' ')}** n'a été trouvé.`);
	let clan_data = clan.rows[0];
	let clan_leader = await pool.query('SELECT user_id FROM "Users" WHERE id IN (SELECT user_id FROM "ClanUser" WHERE clan_id = $1 AND rank IN (\'leader\'))',
		[clan.rows[0].id]);
	let clan_admin = await pool.query('SELECT user_id FROM "Users" WHERE id IN (SELECT user_id FROM "ClanUser" WHERE clan_id = $1 AND rank IN (\'admin\')) ORDER BY reputation DESC, xp DESC LIMIT 10',
		[clan.rows[0].id]);
	let admin_list = '';
	for (var i = 0; i < clan_admin.rowCount; i++) {
		admin_list += `<@${clan_admin.rows[i].user_id}> `
	}
	let clan_members = await pool.query('SELECT user_id FROM "Users" WHERE id IN (SELECT user_id FROM "ClanUser" WHERE clan_id = $1 AND rank IN (\'member\')) ORDER BY reputation DESC, xp DESC LIMIT 10',
		[clan.rows[0].id]);
	let members_list = '';
	for (var i = 0; i < clan_members.rowCount; i++) {
		members_list += `<@${clan_members.rows[i].user_id}> `
	}
	const embed = new RichEmbed()
		.setAuthor(`${clan_data.name} (${clan_data.mode === 0?'Ouvert à tous':clan_data.mode === 1?'Sur invitation':'Fermé'})`)
		.setColor(clan_data.color || 'RANDOM')
		.setDescription(clan_data.description?clan_data.description:'Aucune description')
		.setThumbnail(clan_data.logo?clan_data.logo:msg.guild.iconURL)
		.addField(`Leader :`, `<@${clan_leader.rows[0].user_id}>`,false);
		if(admin_list) embed.addField(`Admins :`, admin_list, false);
		embed.addField(`Membres :`, members_list?members_list:`Pas de membre`, false);

	msg.channel.send(embed);
}


module.exports.config = {
	name: "claninfo",
	description : "See clan info.",
	usage: "claninfo",
	accessibility: [""],
	aliases: ["cinfo"]
}