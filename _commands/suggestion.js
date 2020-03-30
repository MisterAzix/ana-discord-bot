const { RichEmbed } = require('discord.js')

module.exports.run = async (bot, msg, args) => {
	if(msg.guild.id !== '449533868505301002') return;
	const embed = new RichEmbed()
		.setAuthor(`Suggestion by ${msg.author.username}`, msg.author.displayAvatarURL)
		.setDescription(`${args.join(' ')}`)
		.setThumbnail('https://images.emojiterra.com/google/android-pie/512px/1f4cd.png')
		.setTimestamp()
		.setFooter(bot.user.username,bot.user.displayAvatarURL);

	let channel = msg.guild.channels.get('637616547518742529');
	channel.send({embed}).then(async m => {
		await m.react('👍');
		await m.react('👎');
	});
	msg.delete(1000);
}


module.exports.config = {
	name: "suggestion",
	description : "Give a suggestion.",
	usage: "suggestion",
	accessibility: [""],
	aliases: ["suggest","idea"]
}