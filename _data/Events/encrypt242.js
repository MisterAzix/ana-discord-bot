const { RichEmbed } = require('discord.js');
const pool = require('@pool');
const database = require('@database');
const logger = require('@logger');

exports.start = async (bot,guild,eventID) => {

	let selectedChannel = await pool.query('SELECT event_channel FROM "Guilds" WHERE guild_id = $1', [guild.id]);
	let channel = bot.channels.get(selectedChannel.rows[0].event_channel);
	let delayInfo = await pool.query('SELECT abort_delay FROM "EventGuild" WHERE guild_id = $1', [guild.id]);
	let eventInfo = await pool.query('SELECT name, description FROM "Events" WHERE id = $1', [eventID]);

	let alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
	let genTxt = (txtLenght) => {
		let txtTemp = '';
		for (var i = 0; i < txtLenght; i++ ) {
			txtTemp += alpha.charAt(Math.floor(Math.random() * alpha.length));
		}
		return txtTemp;
	}
	let baseCode = genTxt(16);
	let key = genTxt(5);
	let dec = getRandomInt(20)
	let vigenere = (c, k) => alpha[(dec + alpha.indexOf(k) + alpha.indexOf(c) + 26) % 26];
	let coder = (code, key) => [...code].map((c,k) => vigenere(c, key[k % key.length])).join('');
	let encryptedCode = coder(baseCode,key).toString();
	let genField = (d = 0) => {
		let field = '';
		[...alpha].map((c,k) => field += `${c}=${(alpha.indexOf(c) + d) % 26} \u200B \u200B `);
		return field;
	};

	logger(`L'évent $c{blue:${eventInfo.rows[0].name}}} à été lancé sur $c{blue:${guild.name}}}. \nCode : ${encryptedCode}`);
	const embed = new RichEmbed()
		.setTitle(`Un évent automatique vient d'être lancé`)
		.setDescription(eventInfo.rows[0].description)
		.addField(`Voici les infos dont tu as besoin :`,`${genField(dec)}\nCode à chiffrer : **${baseCode}**\nClé de chiffrement : **${key}**`)
		.setFooter(`Message automatique de Ana.`,bot.user.displayAvatarURL)
		.setThumbnail(`https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/twitter/233/chains_26d3.png`);

	channel.send({embed}).then(message => {
		const collector = message.channel.createMessageCollector(m => m.content == encryptedCode && m.author.id != bot.user.id, { time: delayInfo.rows[0].abort_delay });
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
	let xpReward = Math.floor(getRandomInt(200)+200);
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