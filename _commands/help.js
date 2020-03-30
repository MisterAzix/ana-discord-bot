const fs = require('fs');
const { RichEmbed } = require('discord.js');

module.exports.run = (bot, msg, args) => {
	const embed = new RichEmbed()
		.setAuthor(`HELP MENU`)
		.setDescription(`That's my commands list with their accessibility.`);

	fs.readdir('./_commands/', (err, files) => {
		const base_commands = bot.commands.clone();
		files.filter(file => fs.lstatSync(`./_commands/${file}`).isDirectory()).forEach(dir => {
			const folder_commands = fs.readdirSync(`./_commands/${dir}/`).filter(file => file.endsWith(".js"));
			const folder_commands_name = folder_commands.map(fc => fc.split('.')[0].toLowerCase());
			const commands = bot.commands.filter(c => folder_commands_name.includes(c.config.name));
			base_commands.sweep(c => folder_commands_name.includes(c.config.name));

			let commands_list = '';
			commands.map(c => {
				//commands_list += `\`${c.config.name}\` : ${c.config.accessibility[0]?c.config.accessibility[0]:'everyone'}\n`;
				commands_list += `\`${c.config.name}\` : ${c.config.description?c.config.description:''}\n`;
			});
			embed.addField(`${dir} (${commands.size})`,commands_list || 'Nothing',true);
		});
		let commands_list = '';
		base_commands.map(c => {
			//commands_list += `\`${c.config.name}\` : ${c.config.accessibility[0]?c.config.accessibility[0]:'everyone'}\n`;
			commands_list += `\`${c.config.name}\` : ${c.config.description?c.config.description:''}\n`;
		});
		embed.addField(`Other (${base_commands.size})`,commands_list || 'Nothing',true);
		msg.channel.send({embed});
	});
	
}


module.exports.config = {
	name: "help",
	description : "Display the commands menu.",
	usage: "help",
	accessibility: ["beta"],
	aliases: ["aide"]
}