const pool = require('./database.js');
const database = require('./function.js');
const skills = require('./skills.js');

module.exports.run = async (bot) => {
	bot.guilds.forEach(async guild => {
		let result = await pool.query('SELECT base_role, verif_channel, verif_message FROM "Guilds" WHERE guild_id = $1',[guild.id]);
		if(result.rowCount < 1) return;
		if(result.rows[0].verif_channel && result.rows[0].verif_message) {
			bot.channels.get(result.rows[0].verif_channel).fetchMessage(result.rows[0].verif_message).then(msg => {
				msg.react('✅');
				const collector = msg.createReactionCollector((reaction, user) => reaction.emoji.name === '✅' && user.id != bot.user.id);
				collector.on('collect', async r => {
					let id;
					r.users.map(a => id = a.id);
					let role = guild.roles.get(result.rows[0].base_role);
					let member = guild.members.get(id);
					if(!role || member.roles.has(role.id)) return r.remove(member.user);
					member.addRole(role);
					skills.checkRole(guild,member.user);
					skills.checkRank(guild,member.user);
					database.profileCreate(null,member.user,guild);
					r.remove(member.user);
				});
			}).catch();
		}
	});
	
}