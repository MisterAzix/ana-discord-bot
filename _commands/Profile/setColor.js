const pool = require('@pool');
const { RichEmbed } = require('discord.js');


module.exports.run = async (bot, msg, args) => {

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
					collector.stop();
					break;
				case '🔄':
					selectedindex = (selectedindex+1)%3;
					break;
				case '🆗':
					await pool.query('UPDATE "Users" SET color = $1 WHERE user_id = $2 AND guild_id = $3',
						[hexColor,msg.author.id,msg.guild.id]);
					collector.stop();
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
		collector.on('end', () => {
			msg.delete(1000);
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

module.exports.config = {
	name: "setcolor",
	description : "set your profile color.",
	usage: "setcolor",
	accessibility: ["skill",8,5],
	aliases: ["scolor"]
}