const { RichEmbed } = require('discord.js');
const pool = require('../../_struct/database.js');
const database = require('../../_struct/function.js');
const logger = require('../../_struct/logger.js');

//const eventType = [typeRole,typeTopic,typeActivity,typeChannel,typeMessage];
const eventType = [typeRole,typeTopic,typeChannel,typeMessage];
const eventData = [];

exports.start = async (bot,guild,eventID) => {
	let selectedChannel = await pool.query('SELECT event_channel FROM "Guilds" WHERE guild_id = $1', [guild.id]);
	let channel = bot.channels.get(selectedChannel.rows[0].event_channel);
	let delayInfo = await pool.query('SELECT abort_delay FROM "EventGuild" WHERE guild_id = $1', [guild.id]);
	let eventInfo = await pool.query('SELECT name, description FROM "Events" WHERE id = $1', [eventID]);

	let code = (getRandomInt(90) + 10).toString() + "242" + (getRandomInt(90) + 10).toString();
	let selectedEvent = (getRandomInt(eventType.length));
	eventType[selectedEvent](guild,code,true);

	logger(`L'évent $c{blue:${eventInfo.rows[0].name}}} à été lancé sur $c{blue:${guild.name}}}. \nCode : ${code}`);
	const embed = new RichEmbed()
		.setTitle(`Un évent automatique vient d'être lancé`)
		.setDescription(eventInfo.rows[0].description)
		.setFooter(`Message automatique de Ana.`,bot.user.displayAvatarURL)
		.setThumbnail(`https://images.emojiterra.com/mozilla/512px/1f510.png`);

	channel.send({embed}).then(message => {
		const collector = message.channel.createMessageCollector(m => m.content == code.toString() && m.author.id != bot.user.id, { time: delayInfo.rows[0].abort_delay });
		collector.on('collect', () => {
			collector.stop('Finish');
		});
		collector.on('end', (collected, reason) => {
			if(reason === 'Finish') {
				finish(guild,embed,message,selectedEvent,collected.array()[0]);
			}else abort(guild,embed,message,selectedEvent);
		});
	});

}

async function typeRole(guild,code,status) {
	if(status) {
		guild.createRole({
			name:code,
			mentionable:false,
			hoist:false,
			position:1,
			permissions:0,
			color:[1,1,1]
		}).then(async role => {
			let memberList = await pool.query('SELECT user_id FROM "Users" WHERE guild_id = $1 ORDER BY random() LIMIT 100', [guild.id]);
			let selectedMember = memberList.rows.filter(row => guild.members.get(row.user_id));
			let member = guild.members.get(selectedMember.slice(0,1)[0].user_id);
			member.addRole(role);
			eventData[0] = role;
		});
	}else {
		eventData[0].delete('Event Terminé');
	}
}

async function typeTopic(guild,code,status) {
	if(status) {
		let baseRoleID = await pool.query('SELECT base_role FROM "Guilds" WHERE guild_id = $1', [guild.id])
		let baseRole = guild.roles.get(baseRoleID.rows[0].base_role);
		let selectedChannel = await guild.channels.filter(c => c.type === 'text' && c.permissionsFor(baseRole).toArray().includes('VIEW_CHANNEL') && c.name !== 'compteur').random(1);
		eventData[0] = selectedChannel[0].id;
		eventData[1] = selectedChannel[0].topic;
		selectedChannel[0].edit({topic:code.toString()});
	}else {
		guild.channels.get(eventData[0]).edit({topic:eventData[1]?eventData[1]:''});
	}
}

function typeActivity(guild,code,status) {
	if(status) {
		console.log(code);
	}else {
		
	}
}

async function typeChannel(guild,code,status) {
	if(status) {
		let baseRoleID = await pool.query('SELECT base_role FROM "Guilds" WHERE guild_id = $1', [guild.id])
		let selectedCategorie = await guild.channels.filter(c => c.type === 'category').map(c => c.id);
		selectedCategorie.push(undefined);
		guild.createChannel(code, { 
			type:'text',
			permissionOverwrites:[{
				id:baseRoleID.rows[0].base_role, 
				allow:["VIEW_CHANNEL"], 
				deny:["SEND_MESSAGES"]
			}] 
		})
			.then(c => {
				c.setParent(selectedCategorie[getRandomInt(selectedCategorie.length)]);
				eventData[0] = c;
			});
	}else {
		eventData[0].delete('Event Terminé');
	}
}

async function typeMessage(guild,code,status) {
	if(status) {
		let baseRoleID = await pool.query('SELECT base_role FROM "Guilds" WHERE guild_id = $1', [guild.id])
		let baseRole = guild.roles.get(baseRoleID.rows[0].base_role);
		let selectedChannel = await guild.channels.filter(c => c.type === 'text' && c.permissionsFor(baseRole).toArray().includes('VIEW_CHANNEL')).random(1);
		selectedChannel[0].send(code).then(m => eventData[0] = m);
	}else {
		eventData[0].delete('Event Terminé');
	}
}


async function finish(guild,embed,message,selectedEvent,msg) {
	let multiplicator = 1;
	eventType[selectedEvent](guild,0,false);
	await pool.query('UPDATE "EventGuild" SET status = false, event_id = 0 WHERE guild_id = $1', [guild.id]);
	let xpReward = Math.floor((getRandomInt(200)+100)*multiplicator);
	database.addXP(msg, xpReward, msg.author);
	if(getRandomInt(100) === 42) {
		database.addItem(msg, 17, msg.author);
		msg.reply(`Bravo tu obtiens un boost que tu peux ajouter à un mineur !`);
	}
	embed.addField(`Edit`,`L'évènement a été complété par : <@${msg.author.id}>.`);
	message.edit({embed});
	msg.reply(`Le fichier a été déverrouillé avec succès, il contenait ${xpReward} points d'expérience.`);
	logger(`L'évent sur "${guild.name}" a été complété par ${msg.author.tag}.`);
}


async function abort(guild,embed,message,selectedEvent) {
	eventType[selectedEvent](guild,0,false);
	await pool.query('UPDATE "EventGuild" SET status = false, event_id = 0 WHERE guild_id = $1', [guild.id]);
	embed.addField(`Edit`,`Malheuresement l'évènement a expiré, l'équipe de recherche a trouvé le code sans votre aide.`);
	message.edit({embed});
	logger(`L'évent sur "${guild.name}" a expiré.`);
}


function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}