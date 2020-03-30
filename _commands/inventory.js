const { RichEmbed } = require('discord.js');
const pool = require('@pool');
const database = require('@database');
const logger = require('@logger');

module.exports.run = async (bot, msg, args) => {
	var reactionList = ["◀","⏹","🆗","▶"];	
	let choice = 0;
	const embed = await genEmbed(msg,choice);
	msg.channel.send({embed}).then(async message => {
		setReact(message,reactionList);
		const res = await pool.query('SELECT id, name, icon, description, script_ref FROM "Items" ORDER BY id ASC');

		const collector = message.createReactionCollector((reaction, user) => reactionList.includes(reaction.emoji.name) && user.username == msg.author.username, { time: 60000 });
		collector.on('collect', async r => {

			const result = await pool.query('SELECT id, item_id FROM "Inventory" WHERE user_id IN (SELECT id FROM "Users" WHERE user_id = $1 AND guild_id = $2) AND used = false', [msg.author.id,msg.guild.id]);
			switch (r.emoji.name) {
				case '◀':
					choice = (choice+result.rowCount-1)%result.rowCount;
					break;
				case '⏹':
					collector.stop();
					break;
				case '🆗':
					//choice = choice%result.rowCount;
					if(result.rowCount < 1) return collector.stop();
					if(res.rows[result.rows[choice].item_id-1].script_ref) {
						require(`@data/Items/${res.rows[result.rows[choice].item_id-1].script_ref}`).use(bot,msg,result.rows[choice].id);
						//pool.query('UPDATE "Inventory" SET used = true WHERE id = $1', [result.rows[choice].id]);
						choice = (choice+1)%result.rowCount;
						logger(`$c{magenta:${msg.author.username}}} used ${res.rows[result.rows[choice].item_id-1].icon} ${res.rows[result.rows[choice].item_id-1].name} in $c{magenta:${msg.guild.name}}}.`);	
					}
					break;
				case '▶':
					choice = (choice+1)%result.rowCount;
					break;
				default:
					break;
			}
			r.remove(msg.author).then(async () => {
				message.edit(await genEmbed(msg,choice));
			});
		});
		collector.on('end', () => {
			msg.delete(1000);
			message.delete(1000);
		});
	});
}

module.exports.config = {
	name: "inventory",
	description : "Display your inventory.",
	usage: "inventory",
	accessibility: [""],
	aliases: ["inv","inventaire"]
}

async function setReact(message,reactionList) {
	for (var i = 0; i < await reactionList.length; i++) {
		await message.react(reactionList[i]);
	}
}

async function genEmbed(msg,choice) {

	const results = await pool.query('SELECT id, color FROM "Users" WHERE user_id = $1 AND guild_id = $2', [msg.author.id,msg.guild.id]);
	let data = results.rows[0];
	const result = await pool.query('SELECT item_id FROM "Inventory" WHERE user_id = $1 AND used = false', [data.id]);
	const res = await pool.query('SELECT id, name, icon, description FROM "Items" ORDER BY id ASC');

	let line = '';

	if (result.rowCount < 1) {
		line = `Votre inventaire est vide.`;
	}else {
		for (var i = 0; i < result.rowCount; i++) {
			if (i == choice) {
				line += (`${res.rows[result.rows[i].item_id-1].icon} ⬅ `);
			}else {
				line += (`${res.rows[result.rows[i].item_id-1].icon} `);
			}
		}
	}

	const embed = new RichEmbed()

		.setColor(data.color || 'RANDOM')
		.setTitle(`Inventaire`)
		.setDescription(line)
		.setFooter(`Instruction envoyé par : ${msg.author.username}`)
		.setTimestamp();

	if (result.rowCount > 0) {
		embed.addField(res.rows[result.rows[choice].item_id-1].name,res.rows[result.rows[choice].item_id-1].description);
	}

	return embed;

}