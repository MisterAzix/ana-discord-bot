const pool = require('@pool');
const { RichEmbed } = require('discord.js');

exports.use = (bot,msg,item_id) => {
	msg.channel.send(genEmbed(bot,msg,'Choix du dé','Selectionnez un nombre entre 2 et 100.')).then(message => {
		const collector = msg.channel.createMessageCollector(m => m.author.id === msg.author.id, { time: 60000 });
		collector.on('collect', m => {
			let rollNumber = parseInt(m.content.split(' ')[0]);
			if(rollNumber >= 2 && rollNumber <= 100) {
				message.edit(genEmbed(bot,msg,`Tirage sur un dé ${rollNumber}`,`🎲 Résultat : ${getRandomInt(rollNumber)+2}`));
				collector.stop('END');
			}
			m.delete(1000).catch();
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

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}