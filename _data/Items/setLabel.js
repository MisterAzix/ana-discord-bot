const pool = require('@pool');
const { RichEmbed } = require('discord.js');

exports.use = (bot,msg,item_id) => {
	let clan_host = await pool.query('SELECT clan_id FROM "ClanUser" WHERE user_id IN (SELECT id FROM "Users" WHERE user_id = $1 AND guild_id = $2) AND rank IN (\'leader\',\'admin\')',
		[msg.author.id, msg.guild.id]);
	if(clan_host.rowCount < 1) {
		await pool.query('UPDATE "Inventory" SET used = false WHERE id = $1', [item_id]);
		return msg.reply(`Vous n'êtes pas admin de l'escouade.`);
	}
	msg.channel.send(genEmbed(bot,msg,'Définissez un nouveau nom pour votre escouade','Le nom de votre escouade ne peut excéder 25 caractères.')).then(message => {
		const collector = msg.channel.createMessageCollector(m => m.author.id === msg.author.id, { time: 60000 });
		collector.on('collect', async m => {
			if(m.content.length <= 25) {
				message.edit(genEmbed(bot,msg,`Nom de votre escouade mis à jour`,`${m.content}`));
				let role_id = await pool.query('UPDATE "Clans" SET name = $1 WHERE id = $1 RETURNING role_id',
					[clan_host.rows[0].clan_id]);
				if(role_id.rowCount < 1) return collector.stop();
				msg.guild.roles.get(role_id.rows[0].role_id).setName(m.content);
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