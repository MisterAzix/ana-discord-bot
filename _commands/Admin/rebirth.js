const logger = require('@logger');
const fs = require('fs');
const pool = require('@pool');

module.exports.run = async (bot, msg, args) => {
	//logger(`$c{green:REBIRTH HAS BEEN LAUNCH ON ${msg.guild.name}}}`);
	msg.delete(200);

	let separation = {
		files: [{
			attachment: 'assets/rebirth/Séparation.png',
			name: 'Séparation.png'
		}]
	};

	switch (args[0]) {
		case '1':
			let message_1 = fs.readFileSync('assets/rebirth/message_1.txt', 'utf8');
			msg.channel.send(`@everyone\n ${message_1}`);
			msg.channel.send(separation);
			break;
		case '2':
			let message_2 = fs.readFileSync('assets/rebirth/message_2.txt', 'utf8');
			msg.channel.send(`@everyone\n ${message_2}`);
			msg.channel.send(separation);
			break;
		case '3':
			let message_3 = fs.readFileSync('assets/rebirth/message_3.txt', 'utf8');
			msg.channel.send(`@everyone\n ${message_3}`);
			msg.channel.send(separation);
			break;
		case '4':
			let message_4 = fs.readFileSync('assets/rebirth/message_4.txt', 'utf8');
			msg.channel.send(`@everyone\n ${message_4}`);
			msg.channel.send(separation);
			break;
		case '5':
			let message_5 = fs.readFileSync('assets/rebirth/message_5.txt', 'utf8');			
			msg.channel.send(`@everyone\n ${message_5}`);
			msg.channel.send(separation);
			break;
		case '6':
			msg.channel.send('@everyone\n[21h00] Quarantaine OFF !\n```\n--------------------[Logs n°1]--------------------\n\nInitialisation...\nChargement du processus...\nRestauration de la température générale à 20°C...\nChargement des données utilisateurs...\nREBIRTH\n```');
			let result = await pool.query('SELECT verif_channel FROM "Guilds" WHERE guild_id = $1',
				[msg.guild.id]);
			if(result.rowCount < 1) return logger('$c{red:PAS DE VERIF CHANNEL !}}');
			let channel = msg.guild.channels.get(result.rows[0].verif_channel);
			let role = msg.guild.roles.get(msg.guild.id);
			//Unlock règlement !
			channel.overwritePermissions(role, {
				VIEW_CHANNEL: true,
				READ_MESSAGE_HISTORY: true
			});
			break;
		default:
			break;
	}
	
}

module.exports.config = {
	name: "rebirth",
	description : "REBIRTH !!!",
	usage: "rebirth",
	accessibility: ["owner"],
	aliases: [""]
}