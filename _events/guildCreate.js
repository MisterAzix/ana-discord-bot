const logger = require('@logger');
const pool = require('@pool');

module.exports = async (bot,guild) => {
	logger(`$c{blue:${bot.user.username} joined ${guild.name}}}`);
	let guild_data = await pool.query('INSERT INTO "Guilds" (guild_id,prefix) VALUES ($1,\'!\') ON CONFLICT ON CONSTRAINT "Guilds_unique" DO NOTHING RETURNING *', 
		[guild.id]);
	bot.prefix.set(r.guild_id,r.prefix);
	if(guild_data.rowCount > 0) return logger(`The guild $c{blue:${bot.user.username}}} has been added to the database.`);
}