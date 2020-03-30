const pool = require('@pool');
const { RichEmbed } = require('discord.js');

module.exports.run = async (bot, msg, args) => {
	let lvl_top = await pool.query('SELECT user_id, reputation FROM "Users" WHERE guild_id = $1 ORDER BY reputation DESC, xp DESC LIMIT 100', [msg.guild.id]);
	if(lvl_top.rowCount < 1) return msg.reply('Aucun membre à afficher.');
	let lvl_selectedMembers = lvl_top.rows.filter(row => msg.guild.members.get(row.user_id));
	let lvl_topMembers = lvl_selectedMembers.slice(0,10);

	let coin_top = await pool.query('SELECT user_id, coin FROM "Users" WHERE guild_id = $1 ORDER BY coin DESC LIMIT 100', [msg.guild.id]);
	if(coin_top.rowCount < 1) return msg.reply('Aucun membre à afficher.');
	let coin_selectedMembers = coin_top.rows.filter(row => msg.guild.members.get(row.user_id));
	let coin_topMembers = coin_selectedMembers.slice(0,10);

	let lvl_list = '';
	for (var i = 0; i < lvl_topMembers.length; i++) {
		lvl_list += `${i+1}. <@${lvl_topMembers[i].user_id}> : Level ${lvl_topMembers[i].reputation}\n`;
	}

	let coin_list = '';
	for (var i = 0; i < coin_topMembers.length; i++) {
		coin_list += `${i+1}. <@${coin_topMembers[i].user_id}> : Coin ${coin_topMembers[i].coin}\n`;
	}


	const embed = new RichEmbed()
		.setAuthor(`${msg.guild.name} leaderboard.`, msg.guild.diplayAvatarURL)
		.addField(`Reputation top :`,`${lvl_list}`,true)
		.addField(`Coin top :`,`${coin_list}`,true);
	msg.reply(embed);
}


module.exports.config = {
	name: "leaderboard",
	description : "Display the guild leaderboard.",
	usage: "!leaderboard",
	accessibility: [""],
	aliases: ["top"]
}