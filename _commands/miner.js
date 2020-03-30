const pool = require('@pool');
const { RichEmbed } = require('discord.js');

const price = [
			   ['battery',600,2500,5000,10000,25000],
			   ['cooler',2000,4000,8000,16000,32000],
			   ['storage',2500,5000,10000,25000,50000],
			   ['boost']
			  ];

const return_message = ['',
						'Ce composant est déjà au niveau max.',
						'Vous ne possédez pas ce composant dans votre inventaire.',
						'Vous n\'avez pas assez de trombones pour améliorer.',
						'Vous venez d\'améliorer le composant avec succès.',
						'Votre mineur a bien été activé.',
						'Votre mineur viens de s\'arrêter.',
						'Batterie rechargée.',
						'Batterie manquante.',
						'Votre batterie est à plus de 30%.',
						'Il n\'y a rien à récupérer.',
						'Vous récupérez coin_amount trombones.',
						'Votre boost est maintenant activé pour une période de deux heures.',
						'Votre boost est en train de se recharger.',
						'Votre boost est déjà activé.',
						'Votre mineur n\'est pas activé.',
						'Composant manquant.'
						]

module.exports.run = async (bot, msg, args) => {
	const reactionList = ['◀','▶','⛏','🔋','❄','💾','⚡','🆙','🆗'];
	const display = ((args[0]?args[0].toLowerCase():args[0]) === 'display'?true:false);

	let miner_number = 0;
	let choice = 0;
	let return_message_number = 0;
	let coin_amount = 0;

	let gen_number = await pool.query('SELECT id,user_id,status FROM "generator" WHERE user_id IN (SELECT id FROM "Users" WHERE user_id = $1 AND guild_id = $2) ORDER BY id ASC',
		[msg.author.id,msg.guild.id]);
	if(gen_number.rowCount < 1) return msg.reply('Vous ne possédez aucun mineur.');

	const embed = await genEmbed(msg,display,miner_number,choice,return_message_number);
	msg.channel.send({embed}).then(message => {
		setReact(message,reactionList);
		const collector = message.createReactionCollector((reaction, user) => reactionList.includes(reaction.emoji.name) && user.username == msg.author.username, { time: 300000 });
		collector.on('collect', async r => {
			let generator = await pool.query('SELECT id,user_id,status FROM "generator" WHERE user_id IN (SELECT id FROM "Users" WHERE user_id = $1 AND guild_id = $2) ORDER BY id ASC',
				[msg.author.id,msg.guild.id]);

			return_message_number = 0;

			switch (r.emoji.name) {
				case '◀':
					miner_number = (miner_number+generator.rowCount-1)%generator.rowCount;
					choice = 0;
					break;
				case '▶':
					miner_number = (miner_number+1)%generator.rowCount;
					choice = 0;
					break;
				case '⛏':
					choice = 0;
					break;
				case '🔋':
					choice = 1;
					break;
				case '❄':
					choice = 2;
					break;
				case '💾':
					choice = 3;
					break;
				case '⚡':
					choice = 4;
					break;
				case '🆙':
					//Test si le choix est un composant.
					if(choice < 1) break;
					pool.query('SELECT generator_id,type,level FROM "GeneratorComponent" WHERE generator_id = $1 AND type = $2',
						[generator.rows[miner_number].id,price[choice-1][0]]).then(component => {
							//Test si le composant existe.
							if(component.rowCount > 0) {
								//Test si le composant n'est pas déjà niveau maximum.
								if(component.rows[0].level >= 5) return return_message_number = 1; //msg.reply('This component is already maxed.');
								//Test si le composant est le boost (4).
								if(choice === 4) { //
									pool.query('WITH item_data AS (SELECT id FROM "Inventory" WHERE user_id = $1 AND item_id IN (SELECT id FROM "Items" WHERE LOWER(name) = $2) AND used = false LIMIT 1 ) UPDATE "Inventory" SET used = true FROM item_data WHERE "Inventory".id = item_data.id RETURNING "Inventory".id',
										[generator.rows[miner_number].user_id,price[choice-1][0]]).then(items => {
											//Test si le membre possède un boost dans son inventaire pour levelup.
											if(items.rowCount < 1) return return_message_number = 2; //msg.reply('You don\'t have the component in your Inventory.');
											pool.query('UPDATE "GeneratorComponent" SET level = level+1 WHERE generator_id = $1 AND type = $2',
												[component.rows[0].generator_id,component.rows[0].type]);
										});
								//Le composant n'est pas un boost
								}else {
									pool.query('UPDATE "Users" SET coin = coin-$1 WHERE id = $2 AND coin >= $1 RETURNING coin',
										[price[choice-1][component.rows[0].level+1],generator.rows[miner_number].user_id]).then(coin => {
											//Test si le membre possède assez d'argent pour levelup.
											if(coin.rowCount < 1) return return_message_number = 3; //msg.reply('You don\'t have the money to levelup.');
											pool.query('UPDATE "GeneratorComponent" SET level = level+1 WHERE generator_id = $1 AND type = $2',
												[component.rows[0].generator_id,component.rows[0].type]);
											return_message_number = 4; //msg.reply('You levelup the component.');
										});
								}
							//Le composant n'existe pas alors test si un est disponible.
							}else {
								pool.query('WITH item_data AS (SELECT id FROM "Inventory" WHERE user_id = $1 AND item_id IN (SELECT id FROM "Items" WHERE LOWER(name) = $2) AND used = false LIMIT 1 ) UPDATE "Inventory" SET used = true FROM item_data WHERE "Inventory".id = item_data.id RETURNING "Inventory".id',
									[generator.rows[miner_number].user_id,price[choice-1][0]]).then(items => {
										if(items.rowCount < 1) return return_message_number = 2; //msg.reply('You don\'t have the component in your Inventory.');
										pool.query('INSERT INTO "GeneratorComponent" (generator_id,type,item_id) VALUES ($1,$2,$3)',
											[generator.rows[miner_number].id,price[choice-1][0],items.rows[0].id]);
									});
							}
						});
					break;
				case '🆗':
					let generator_component = await pool.query('SELECT type,level,value FROM "GeneratorComponent" WHERE generator_id = $1',
						[generator.rows[miner_number].id]);
					switch (choice) {
						case 0: //ON/OFF
							pool.query('WITH battery_value AS (SELECT value FROM "GeneratorComponent" WHERE generator_id = $1 AND type = \'battery\'), storage_value AS (SELECT level,value FROM "GeneratorComponent" WHERE generator_id = $1 AND type = \'storage\') UPDATE "generator" SET status = CASE WHEN status = false THEN CASE WHEN battery_value.value > 0 AND storage_value.value < storage_value.level*1000 THEN true ELSE false END ELSE false END FROM battery_value,storage_value WHERE id = $1 RETURNING status',
								[generator.rows[miner_number].id]).then(status => {
									if(status.rowCount < 1) return_message_number = 16; //Missing component.
									else if(status.rows[0].status === true) return_message_number = 5; //msg.reply('Your miner has been launched.');
									else if(status.rows[0].status === false) return_message_number = 6; //msg.reply('Your miner has been shutdowned.');
									//else msg.reply('Missing battery.');
								});
							break;
						case 1: //Reload battery
							let battery_value = await pool.query('SELECT value FROM "GeneratorComponent" WHERE generator_id = $1 AND type = \'battery\'',
								[generator.rows[miner_number].id]);
							if(battery_value.rowCount > 0?battery_value.rows[0].value <= 30:false) {
								
								pool.query('WITH battery_inventory AS (SELECT id FROM "Inventory" WHERE user_id = $1 AND item_id = 12 AND used = false LIMIT 1), updated_battery AS (UPDATE "Inventory" SET used = true FROM battery_inventory WHERE "Inventory".id = battery_inventory.id RETURNING "Inventory".id) UPDATE "GeneratorComponent" SET item_id = battery_inventory.id, value = 100 FROM battery_inventory WHERE generator_id = $2 AND type = \'battery\' RETURNING id',
									[generator.rows[miner_number].user_id,generator.rows[miner_number].id]).then(result => {
										if(result.rowCount > 0) return_message_number = 7; //msg.reply('Battery reloaded.');
										else return_message_number = 8; //msg.reply('Missing battery.');
									});
							}else return_message_number = 9; //msg.reply('Your battery is over 30%.');
							break;
						case 3: //Claim coin
							pool.query('WITH coin_value AS (SELECT generator_id,value FROM "GeneratorComponent" WHERE generator_id = $1 AND type = \'storage\'), generator AS (UPDATE "generator" SET total_mined = total_mined + coin_value.value FROM coin_value WHERE id = coin_value.generator_id RETURNING user_id), users AS (UPDATE "Users" SET coin = coin + coin_value.value FROM coin_value, generator WHERE id = generator.user_id) UPDATE "GeneratorComponent" AS component SET value = 0 FROM coin_value WHERE component.generator_id = coin_value.generator_id AND type = \'storage\' RETURNING coin_value.value',
								[generator.rows[miner_number].id]).then(value => {
									if(value.rows[0].value === 0) return_message_number = 10; //msg.reply('Nothing to claim.');
									else {
										return_message_number = 11; //msg.reply(`You claimed ${value.rows[0].value} coin.`);
										coin_amount = value.rows[0].value;
									}

								});
							break;
						case 4: //Start the boost
							pool.query('WITH miner_status AS (SELECT status FROM "generator" WHERE id = $1), boost_value AS (SELECT value FROM "GeneratorComponent" WHERE generator_id = $1 AND type = \'boost\'), boost_update AS (UPDATE "generator" SET boost_status = CASE WHEN boost_value.value < date_part(\'epoch\',CURRENT_TIMESTAMP at time zone \'Europe/Paris\')::int THEN true ELSE false END FROM boost_value WHERE id = $1 AND boost_status = false RETURNING boost_status) UPDATE "GeneratorComponent" SET value = CASE WHEN boost_update.boost_status = true THEN date_part(\'epoch\',CURRENT_TIMESTAMP at time zone \'Europe/Paris\')::int+7200 ELSE value END FROM boost_update WHERE generator_id = $1 AND type = \'boost\' RETURNING boost_update.boost_status',
								[generator.rows[miner_number].id]).then(time => {
									if(time.rowCount > 0) {
										if(time.rows[0].boost_status === true) return_message_number = 12; //msg.reply('Boost has been launched for 2 hours.');
										else return_message_number = 13; //msg.reply('Boost is reloading.');
									}
									else if(generator.rows[miner_number].status){
										return_message_number = 14; //msg.reply('Boost is already launched.');
									}else return_message_number = 15; //msg.reply('Miner is not running.');
								});
							break;
					}
					break;
			}
			r.remove(msg.author).then(async () => {
				message.edit(await genEmbed(msg,display,miner_number,choice,return_message_number,coin_amount));
			});
		});
		collector.on('end', () => {
			msg.delete(1000);
			message.delete(1000);
		});
	});
}

module.exports.config = {
	name: "miner",
	description : "Show your miner",
	usage: "miner",
	accessibility: [""],
	aliases: ["mineur","mine"]
}

async function setReact(message,reactionList) {
	for (var i = 0; i < await reactionList.length; i++) {
		await message.react(reactionList[i]);
	}
}

async function genEmbed(msg,display,miner_number,choice,return_message_number,coin_amount) {

	let generator = await pool.query('SELECT id,status,total_mined,boost_status FROM "generator" WHERE user_id IN (SELECT id FROM "Users" WHERE user_id = $1 AND guild_id = $2) ORDER BY id ASC',
		[msg.author.id,msg.guild.id]);
	let generator_component = await pool.query('SELECT generator_id,type,level,value FROM "GeneratorComponent" WHERE generator_id IN (SELECT id FROM "generator" WHERE user_id IN (SELECT id FROM "Users" WHERE user_id = $1 AND guild_id = $2) ORDER BY id ASC)',
		[msg.author.id,msg.guild.id]);

	const embed = new RichEmbed()
		.setAuthor(`${msg.author.username}'s miner rack.`)
		.setThumbnail('https://images.emojiterra.com/twitter/v12/512px/26cf.png');

		let choosen_generator = generator_component.rows.filter(r => r.generator_id === generator.rows[miner_number].id);
		let lvl;
		let description;
		switch (choice) {
			case 0:
				let production = Math.floor((50+50*(50-(choosen_generator.find(r => r.type === 'cooler')?choosen_generator.find(r => r.type === 'cooler').value:50))/100*1.5));
				let boosted_production = Math.floor((50+50*(50-(choosen_generator.find(r => r.type === 'cooler')?choosen_generator.find(r => r.type === 'cooler').value:50))/100*1.5)*(1+(choosen_generator.find(r => r.type === 'boost')?choosen_generator.find(r => r.type === 'boost').level:0)*5/100));
				embed.setTitle(`⛏ Miner ${miner_number+1} infos :`);
				description = `Status : ${generator.rows[miner_number].status?'ON':'OFF'}\nProduction : **${production}**t/10min (**${production/10}**t/min)\nBoosted Production : **${boosted_production}**t/10min (**${boosted_production/10}**t/min)\nTotal Mined : ${generator.rows[miner_number].total_mined}`;
				break;
			case 1:
				embed.setTitle(`🔋 Battery infos :`);
				lvl = choosen_generator.find(r => r.type === 'battery')?choosen_generator.find(r => r.type === 'battery').level:0;
				description = '';
				if(lvl === 0) {
					description = 'You need to buy a battery to start your miner.';
					break;
				}
				for (var i = 1; i <= 5; i++) {
					description += `Lvl ${i} : ${i <= lvl?'Unlocked':price[0][i]+' to unlock'}\n`;
				}
				break;
			case 2:
				embed.setTitle(`❄ Cooler infos :`);
				lvl = choosen_generator.find(r => r.type === 'cooler')?choosen_generator.find(r => r.type === 'cooler').level:0;
				description = '';
				if(lvl === 0) {
					description = 'Buy a cooler in the shop to reduce the temperature.';
					break;
				}
				for (var i = 1; i <= 5; i++) {
					description += `Lvl ${i} : ${i <= lvl?'Unlocked':price[1][i]+' to unlock'}\n`;
				}
				break;
			case 3:
				embed.setTitle(`💾 Storage infos :`);
				lvl = choosen_generator.find(r => r.type === 'storage')?choosen_generator.find(r => r.type === 'storage').level:0;
				description = '';
				if(lvl === 0) {
					description = 'Your miner need a storage to mine. Buy one in the shop.';
					break;
				}
				for (var i = 1; i <= 5; i++) {
					description += `Lvl ${i} : ${i <= lvl?'Unlocked':price[2][i]+' to unlock'}\n`;
				}
				break;
			case 4:
				embed.setTitle(`⚡ Boost infos :`);
				lvl = choosen_generator.find(r => r.type === 'boost')?choosen_generator.find(r => r.type === 'boost').level:0;
				let value = choosen_generator.find(r => r.type === 'boost')?choosen_generator.find(r => r.type === 'boost').value:0;
				let time = `${Math.floor((value - Date.now()/1000)/3600)}h${Math.floor((value - Date.now()/1000)/60)%60}m${Math.round(value - Date.now()/1000)%60}s`;
				description = `Lvl : ${lvl} ${lvl > 0?`\n${value - Date.now()/1000 > 0?`${generator.rows[miner_number].boost_status?`Time of boost : ${time}`:`Time until reloading : ${time}`}`:'Ready'}`:''}\nYou can upgrade it by dropping boost item with a small drop chance in events.`;
				break;
		}
		embed.setDescription(description);

		for (var i = 0; i < 8; i++) {
			if(generator.rows[i]) {
				let data = generator_component.rows.filter(r => r.generator_id === generator.rows[i].id);
				let battery = `🔋 Battery : ${data.find(r => r.type === 'battery')?`${data.find(r => r.type === 'battery').value}**%** `:'Missing'}${miner_number === i?(choice === 1?'⬅':''):''}`;
				let cooler = `❄ Cooler : ${data.find(r => r.type === 'cooler')?`${data.find(r => r.type === 'cooler').value}**°C**`:'Missing'} ${miner_number === i?(choice === 2?'⬅':''):''}`;
				let storage = `💾 Storage : ${data.find(r => r.type === 'storage')?`${data.find(r => r.type === 'storage').value}**/${data.find(r => r.type === 'storage').level*1000}**`:'Missing'} ${miner_number === i?(choice === 3?'⬅':''):''}`;
				let boost = `⚡ Boost : ${data.find(r => r.type === 'boost')?`${data.find(r => r.type === 'boost').level*5}`:'0'}**%** ${generator.rows[i].boost_status?'ON':'OFF'} ${miner_number === i?(choice === 4?'⬅':''):''}`;
				embed.addField(`Miner [${i+1}] ${generator.rows[i].status?'ON':'OFF'}: ${miner_number === i?'⬅':''}`,`${battery}\n${cooler}\n${storage}\n${boost}`,true);
			}else if(display){
				embed.addField(`Miner [${i+1}] :`,`🔋 Battery : ❌\n❄ Cooler : ❌\n💾 Storage : ❌\n⚡ Boost : ❌`,true);
			}else break;
		}

		if(return_message_number !== 0) {
			if(return_message_number === 11) embed.addField('\u200B',`ℹ **${return_message[return_message_number].replace('coin_amount',coin_amount)}** ℹ`);
			else embed.addField('\u200B',`ℹ **${return_message[return_message_number]}** ℹ`);
		}

	return embed;
	
}

function getRandomInt(max) {
	return Math.floor(Math.random() * Math.floor(max));
}