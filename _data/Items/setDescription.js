const pool = require('@pool');
const { RichEmbed } = require('discord.js');

exports.use = async (bot,msg,item_id) => {
	let clan_host = await pool.query('SELECT clan_id FROM "ClanUser" WHERE user_id IN (SELECT id FROM "Users" WHERE user_id = $1 AND guild_id = $2) AND rank IN (\'leader\',\'admin\')',
		[msg.author.id, msg.guild.id]);
	if(clan_host.rowCount < 1) {
		await pool.query('UPDATE "Inventory" SET used = false WHERE id = $1', [item_id]);
		return msg.reply(`Vous n'êtes pas admin de l'escouade.`);
	}
	msg.channel.send(genEmbed(bot,msg,'Définissez une description pour votre escouade','La description ne peut excéder 512 caractères.')).then(message => {
		const collector = msg.channel.createMessageCollector(m => m.author.id === msg.author.id, { time: 60000 });
		collector.on('collect', async m => {
			if(m.content.length <= 512) {
				message.edit(genEmbed(bot,msg,`Description de l'escouade mise à jour`,`${m.content}`));
				await pool.query('UPDATE "Clans" SET description = $1 WHERE id = $2',
					[m.content,clan_host.rows[0].clan_id]);
				collector.stop('END');
			}
			m.delete(1000);
		});
		collector.on('end', (reason) => {
			if(reason === 'END') pool.query('UPDATE "Inventory" SET used = true WHERE id = $1', [item_id]);
		});
	});
	
}

function genEmbed(bot,msg,title,description) {
	const embed = new RichEmbed()
		.setAuthor(title)
		.setDescription(description)
		.setColor('RANDOM')
		.setFooter(msg.author.username, msg.author.displayAvatarURL)
		.setTimestamp();
	return embed;
}