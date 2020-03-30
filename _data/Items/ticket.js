const pool = require('@pool');
const database = require('@database');
const { RichEmbed } = require('discord.js');

exports.use = async (bot,msg,item_id) => {
	let skill_user = await pool.query('SELECT skill_id FROM "SkillUser" WHERE id IN (SELECT id FROM "Users" WHERE user_id = $1 AND guild_id = $2) AND skill_id = 12 AND level = 5',
		[msg.author.id, msg.guild.id]);
	if(skill_user.rowCount < 1) {
		await pool.query('UPDATE "Inventory" SET used = false WHERE id = $1', [item_id]);
		return msg.reply(`Tu n'as pas encore les compétences pour créer une escouade.`);
	}
	msg.channel.send(genEmbed(bot,msg,'Définissez un nom pour votre escouade','Ce nom ne peut excéder 25 caractères.')).then(message => {
		const collector = msg.channel.createMessageCollector(m => m.author.id === msg.author.id, { time: 60000 });
		collector.on('collect', async m => {
			if(m.content.length <= 25) {
				database.createClan(msg, msg.author, m.content);
				message.edit(genEmbed(bot,msg,`Escouade créée`,`${m.content}`));
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