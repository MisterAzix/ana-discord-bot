const database = require('@database');
const pool = require('@pool');

module.exports = async (bot, msg) => {

	//if(msg.author.id !== '177506696174895104') return;
	let prefix = bot.prefix.get(msg.guild.id);
	if(msg.author.bot || msg.channel.type === 'dm') return;

	checkXP(msg);
	if (!msg.content.startsWith(prefix)) return;
	if(!msg.member.hasPermission('ADMINISTRATOR')) {
		let channel = await pool.query('SELECT command_channel FROM "Guilds" WHERE guild_id = $1 AND command_channel = $2', [msg.guild.id, msg.channel.id]);
		if(channel.rowCount < 1) return;
	}

	let messageArray = msg.content.split(/ +/g);
	let command = messageArray[0].slice(prefix.length).toLowerCase();
	let args = messageArray.slice(1);

	let commandFile = bot.commands.get(command) || bot.commands.find(c => c.config.aliases.includes(command));
	if(!commandFile) return;
	let accessibility = commandFile.config.accessibility;

	switch (accessibility[0]) {
		case 'owner':
			if(msg.author.id !== '177506696174895104') return msg.reply('Commande reservée à l\'owner.');
			break;
		case 'admin':
			if(!msg.member.hasPermission('ADMINISTRATOR')) return msg.reply('Commande reservée aux administrateurs.');
			break;
		case 'beta':
			if(msg.author.id !== '177506696174895104') {
				if(msg.guild.id !== '639135582408278016') return msg.reply('Commande en développement.');
			}
			break;
		case 'skill':
			let skill = await pool.query('SELECT name, icon FROM "Skills" WHERE id = $1', [accessibility[1]]);
			let skill_user = await pool.query('SELECT skill_id FROM "SkillUser" WHERE id IN (SELECT id FROM "Users" WHERE user_id = $1 AND guild_id = $2) AND skill_id = $3 AND level >= $4',
				[msg.author.id, msg.guild.id , accessibility[1], accessibility[2]]);
			if(skill_user.rowCount < 1) return msg.reply(`Tu n'as pas les compétences pour exécuter cette commandes. Tu dois être niveau **${accessibility[2]}** en skill ${skill.rows[0].icon} **${skill.rows[0].name}**.`);
			break;
		default:
			break;
	}
	commandFile.run(bot,msg,args);
}

async function checkXP(msg) {
	//Ajouter de l'xp
	let date = new Date();
	let messageDelay = 30000;
	const User = await pool.query('SELECT date_msg FROM "Users" WHERE user_id = $1 AND guild_id = $2', [msg.author.id,msg.guild.id]);
	if(User.rowCount < 1) return;
	if(parseInt(User.rows[0].date_msg)+messageDelay <= date.getTime()) {
		let values = (Math.floor(Math.random() * Math.floor(15)))+5;
		database.addXP(msg, values, msg.author);
		await pool.query('UPDATE "Users" SET date_msg = $1 WHERE user_id = $2 AND guild_id = $3', [date.getTime(),msg.author.id,msg.guild.id]);
	}
}