const pool = require('@pool');
const { RichEmbed } = require('discord.js');

exports.use = async (bot,msg,item_id) => {
	let clan_host = await pool.query('SELECT clan_id FROM "ClanUser" WHERE user_id IN (SELECT id FROM "Users" WHERE user_id = $1 AND guild_id = $2) AND rank IN (\'leader\',\'admin\')',
		[msg.author.id, msg.guild.id]);
	if(clan_host.rowCount < 1) {
		await pool.query('UPDATE "Inventory" SET used = false WHERE id = $1', [item_id]);
		return msg.reply(`Vous n'êtes pas admin de l'escouade.`);
	}

	let reactionList = ["⏮","⏪","◀","⏹","🔄","🆗","▶","⏩","⏭"];
	let rgb = [255,255,255];
	let hexColor = (rgb[0] > 15?rgb[0].toString(16):'0'+rgb[0].toString(16)) + (rgb[1] > 15?rgb[1].toString(16):'0'+rgb[1].toString(16)) + (rgb[2] > 15?rgb[2].toString(16):'0'+rgb[2].toString(16));
	let selectedindex = 0;

	const embed = genEmbed(hexColor,selectedindex,rgb[0],rgb[1],rgb[2]);
	msg.channel.send({embed}).then((message) => {
		setReact(message,reactionList);
		const collector = message.createReactionCollector((reaction, user) => reactionList.includes(reaction.emoji.name) && user.username == msg.author.username, { time: 300000 });
		collector.on('collect', async r => {
			switch(r.emoji.name) {
				case '⏮':
					rgb[selectedindex] = ((rgb[selectedindex]-100)%255)<0?255-100+rgb[selectedindex]:((rgb[selectedindex]-100)%255);
					break;
				case '⏪':
					rgb[selectedindex] = ((rgb[selectedindex]-10)%255)<0?255-10+rgb[selectedindex]:((rgb[selectedindex]-10)%255);
					break;
				case '◀':
					rgb[selectedindex] = ((rgb[selectedindex]-1)%255)<0?255-1+rgb[selectedindex]:((rgb[selectedindex]-1)%255);
					break;
				case '⏹':
					collection.stop();
					break;
				case '🔄':
					selectedindex = (selectedindex+1)%3;
					break;
				case '🆗':
					let clan = await pool.query('UPDATE "Clans" SET color = $1 WHERE id = $2 RETURNING role_id',
						[hexColor, clan_host.rows[0].clan_id]);
					if(clan.rowCount > 0) msg.guild.roles.get(clan.rows[0].role_id).edit({color:hexColor});
					collector.stop('END');
					msg.reply("Couleur mise à jour.");
					break;
				case '▶':
					rgb[selectedindex] = (rgb[selectedindex]+1)%255;
					break;
				case '⏩':
					rgb[selectedindex] = (rgb[selectedindex]+10)%255;
					break;
				case '⏭':
					rgb[selectedindex] = (rgb[selectedindex]+100)%255;
					break;
				default:
					break;
			}
			r.remove(msg.author);
			hexColor = (rgb[0] > 15?rgb[0].toString(16):'0'+rgb[0].toString(16)) + (rgb[1] > 15?rgb[1].toString(16):'0'+rgb[1].toString(16)) + (rgb[2] > 15?rgb[2].toString(16):'0'+rgb[2].toString(16));
			message.edit(genEmbed(hexColor,selectedindex,rgb[0],rgb[1],rgb[2]));
		});
		collector.on('end', (reason) => {
			if(reason === 'END') pool.query('UPDATE "Inventory" SET used = true WHERE id = $1', [item_id]);
			message.delete(1000);
		});
	});
}

async function setReact(message,reactionList) {
	for (var i = 0; i < await reactionList.length; i++) {
		await message.react(reactionList[i]);
	}
}

function genEmbed(color,selectedindex,red,green,blue) {

	const embed = new RichEmbed()
		.setColor(color)
		.setTitle(`Color Selector`)
		.setURL(`https://www.google.fr/search?q=color+picker+rbg&oq=color+picker+rgb&aqs=chrome..69i57j0l5.3033j0j7&sourceid=chrome&ie=UTF-8`)
		.setDescription(`Ici tu peux personnaliser la couleur s'affichant sur tes embed simplement avec l'utilisation des flèches en réaction. Pour t'aider, cliques sur Color Selector et choisir la couleur qui te plaît. Ensuite indiques les mêmes valeurs RGB.`)
		.setFooter(`Message automatique de Ana.`)
		.setTimestamp();

	switch(selectedindex) {
		case 0:
			embed.addField(`📕     ⬅`,red,true);
			embed.addField(`📗` ,green,true);
			embed.addField(`📘` ,blue,true);
			break;
		case 1:
			embed.addField(`📕`,red,true);
			embed.addField(`📗     ⬅`,green,true);
			embed.addField(`📘` ,blue,true);
			break;
		case 2:
			embed.addField(`📕`,red,true);
			embed.addField(`📗` ,green,true);
			embed.addField(`📘     ⬅`,blue,true);
			break;
		default:
			embed.addField(`📕     ⬅`,red,true);
			embed.addField(`📗` ,green,true);
			embed.addField(`📘` ,blue,true);
			break;
	}
	return embed;
}