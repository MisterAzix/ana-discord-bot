const { RichEmbed, Attachment } = require('discord.js');
const pool = require('../../_struct/database.js');
const database = require('../../_struct/function.js');
const { createCanvas } = require('canvas');
const logger = require('../../_struct/logger.js');

exports.start = async (bot,guild,eventID) => {

	let selectedChannel = await pool.query('SELECT event_channel FROM "Guilds" WHERE guild_id = $1', [guild.id]);
	let channel = bot.channels.get(selectedChannel.rows[0].event_channel);
	let delayInfo = await pool.query('SELECT abort_delay FROM "EventGuild" WHERE guild_id = $1', [guild.id]);
	let eventInfo = await pool.query('SELECT name, description FROM "Events" WHERE id = $1', [eventID]);

	let code = `${(getRandomInt(89999999)+10000000).toString(16)}-${(getRandomInt(8999)+1000).toString(16)}-${(getRandomInt(8999)+1000).toString(16)}-${(getRandomInt(8999)+1000).toString(16)}-${(getRandomInt(899999999999)+100000000000).toString(16)}`;

	const canvas = createCanvas(600, 100);
	const ctx = canvas.getContext('2d');

	ctx.textAlign = "center";
	ctx.fillStyle = 'rgba(255, 255, 255, 1)';
	ctx.font = '25px Bahnschrift';
	ctx.fillText(code, canvas.width/2, canvas.height/2);

	const attachment = new Attachment(canvas.toBuffer(), 'image.png');
	const embed = new RichEmbed()
		.setTitle(`Un évent automatique vient d'être lancé`)
		.setDescription(eventInfo.rows[0].description)
		.setFooter(`Message automatique de Ana.`,bot.user.displayAvatarURL)
		.attachFile(attachment)
		.setImage(`attachment://image.png`)
		.setThumbnail(`https://png.icons8.com/ios/1600/binary-file.png`);

	logger(`L'évent $c{blue:${eventInfo.rows[0].name}}} à été lancé sur $c{blue:${guild.name}}}. \nCode : ${code}`);
	channel.send({embed}).then(message => {
		const collector = message.channel.createMessageCollector(m => m.content == code.toString() && m.author.id != bot.user.id, { time: delayInfo.rows[0].abort_delay });
		collector.on('collect', () => {
			collector.stop('Finish');
		});
		collector.on('end', (collected, reason) => {
			if(reason === 'Finish') {
				finish(guild,embed,message,collected.array()[0]);
			}else abort(guild,embed,message);
		});
	});
}


async function finish(guild,embed,message,msg) {
	await pool.query('UPDATE "EventGuild" SET status = false, event_id = 0 WHERE guild_id = $1', [guild.id]);
	let xpReward = Math.floor(getRandomInt(100)+150);
	database.addXP(msg, xpReward, msg.author);
	if(getRandomInt(100) === 42) {
		database.addItem(msg, 17, msg.author);
		msg.reply(`Bravo tu obtiens un boost que tu peux ajouter à un mineur !`);
	}
	embed.addField(`Edit`,`L'évènement a été complété par : <@${msg.author.id}>.`);
	message.edit({embed});
	msg.reply(`Merci à toi, pour te remercier voilà ${xpReward} points d'expérience.`);
	logger(`L'évent sur "${guild.name}" a été complété par ${msg.author.tag}.`);
}


async function abort(guild,embed,message) {
	await pool.query('UPDATE "EventGuild" SET status = false, event_id = 0 WHERE guild_id = $1', [guild.id]);
	embed.addField(`Edit`,`Malheuresement l'évènement a expiré, les chercheurs l'ont fait eux même.`);
	message.edit({embed});
	logger(`L'évent sur "${guild.name}" a expiré.`);
}


function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}