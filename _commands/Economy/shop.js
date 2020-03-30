const { RichEmbed } = require('discord.js');
const pool = require('@pool');
const database = require('@database');
const logger = require('@logger');

module.exports.run = async (bot, msg, args) => {
	var reactionList = ["◀","🆗","🔄","▶"];
	var choice = 0;
	var page = 0;
	var bottom_value = 0;
	const embed = await genEmbed(msg,choice,page);
	msg.channel.send({embed}).then(async message => {
		setReact(message,reactionList);
		const nbr_page = await pool.query('SELECT MAX(page) FROM "Shop" WHERE guild_id = $1', [msg.guild.id]);
		const res = await pool.query('SELECT id, name, icon, description, price, max_purchase FROM "Items" ORDER BY id ASC');
		const collector = message.createReactionCollector((reaction, user) => reactionList.includes(reaction.emoji.name) && user.username == msg.author.username, { time: 60000 });
		collector.on('collect', async r => {

			const results = await pool.query('SELECT id, coin FROM "Users" WHERE user_id = $1 AND guild_id = $2', [msg.author.id,msg.guild.id]);
			const result = await pool.query('SELECT item_id, quantity FROM "Shop" WHERE page = $1 AND guild_id = $2 ORDER BY item_id ASC', [page+1,msg.guild.id]);
			//if(result.rowCount < 1) collector.stop();
			switch (r.emoji.name) {
				case '◀':
					choice = (choice+result.rowCount-1)%result.rowCount;
					bottom_value = 0;
					break;
				case '🆗':
					if(result.rows[choice].quantity > 0) {
						if(results.rows[0].coin >= res.rows[result.rows[choice].item_id-1].price) {
							if(res.rows[result.rows[choice].item_id-1].max_purchase > 0) {
								let item_count = await pool.query('SELECT id FROM "Inventory" WHERE user_id = $1 AND item_id = $2', [results.rows[0].id,res.rows[result.rows[choice].item_id-1].id]);
								if(item_count.rowCount < res.rows[result.rows[choice].item_id-1].max_purchase) {
									database.delCoin(msg, res.rows[result.rows[choice].item_id-1].price, msg.author);
									database.addItem(msg, result.rows[choice].item_id, msg.author);
									database.editShop(msg, result.rows[choice].item_id);
									logger(`$c{magenta:${msg.author.id}}} bought item $c{magenta:${res.rows[result.rows[choice].item_id-1].name}}} on $c{magenta:${msg.guild.name}}}.`);
								}else bottom_value = 3;
							}else {
								database.delCoin(msg, res.rows[result.rows[choice].item_id-1].price, msg.author);
								database.addItem(msg, result.rows[choice].item_id, msg.author);
								database.editShop(msg, result.rows[choice].item_id);
								logger(`$c{magenta:${msg.author.id}}} bought item $c{magenta:${res.rows[result.rows[choice].item_id-1].name}}} on $c{magenta:${msg.guild.name}}}.`);
							}
						}else bottom_value = 2;
					}else bottom_value = 1;
					break;
				case '🔄':
					page = (page+1)%(nbr_page.rowCount > 0?nbr_page.rows[0].max:2);
					choice = 0;
					bottom_value = 0;
					break;
				case '▶':
					choice = (choice+1)%result.rowCount;
					bottom_value = 0;
					break;
				default:
					break;
			}
			r.remove(msg.author).then(async () => {
				message.edit(await genEmbed(msg,choice,page,bottom_value));
			});
		});
		collector.on('end', () => {
			msg.delete(1000);
			message.delete(1000);
		});
	});
}

module.exports.config = {
	name: "shop",
	description : "Display the shop.",
	usage: "shop",
	accessibility: [""],
	aliases: ["magasin"]
}

async function setReact(message,reactionList) {
	for (var i = 0; i < await reactionList.length; i++) {
		await message.react(reactionList[i]);
	}
}

async function genEmbed(msg,choice,page,bottom_value) {

	const results = await pool.query('SELECT id, color, coin FROM "Users" WHERE user_id = $1 AND guild_id = $2', [msg.author.id,msg.guild.id]);
	let data = results.rows[0];
	const result = await pool.query('SELECT item_id, quantity FROM "Shop" WHERE page = $1 AND guild_id = $2 ORDER BY item_id ASC', [page+1,msg.guild.id]);
	const res = await pool.query('SELECT id, name, icon, description, price FROM "Items" ORDER BY id ASC');

	//console.log(res.rows);

	const embed = new RichEmbed()

		//.setColor(data.color)
		.setTitle(`Le Marchand`)
		.setThumbnail(`https://images-na.ssl-images-amazon.com/images/I/81bOGNmmTpL._SX425_.jpg`)
		.setDescription(`Bien le bonjour réfugiés je viens vous vendre ce que j'ai trouvé à l'extérieur du Repère. Aujourd'hui j'ai donc pour vous ceci :`)
		.setTimestamp()

		.addBlankField()
		.addField(`Nombre de trombones de ${msg.author.username}`,data.coin)
		.addBlankField()
		.addField(res.rows[result.rows[choice].item_id-1].name + " :",res.rows[result.rows[choice].item_id-1].description)
		.addField(`Prix : ${res.rows[result.rows[choice].item_id-1].price}`,`\u200B`);

	for (var i = 0; i < result.rowCount; i++) {
		if (i==choice) {
			embed.addField(`${res.rows[result.rows[i].item_id-1].icon} ${res.rows[result.rows[i].item_id-1].name} ⬅`, result.rows[i].quantity > 0?result.rows[i].quantity:'Rupture de stock',true);
		}else {
			embed.addField(`${res.rows[result.rows[i].item_id-1].icon} ${res.rows[result.rows[i].item_id-1].name}`, result.rows[i].quantity > 0?result.rows[i].quantity:'Rupture de stock',true);
		}
	}

	switch (bottom_value) {
		case 0:
			break;
		case 1:
			embed.addField("\u200B","⚠ Cet objet est en rupture de stock. Reviens demain lorsque mes explorateurs m'en auront rapporté d'autres. ⚠");
			break;
		case 2:
			embed.addField("\u200B","⚠ Tu n'as pas assez de trombones pour acheter ce fabuleux article. Reviens me voir quand tu auras récolté la somme. ⚠");
			break;
		case 3:
			embed.addField("\u200B","⚠ La limite d'achat de cet objet a été atteinte. ⚠");
			break;
		default:
			break;
	}
	return embed;

}