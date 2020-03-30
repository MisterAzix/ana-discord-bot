const logger = require('@logger');
const pool = require('@pool');

module.exports = async (bot,guild) => {
	logger(`$c{blue:${bot.user.username} left ${guild.name}}}`);
	await pool.query('UPDATE "Guilds" SET event_channel = null WHERE guild_id = $1', [guild.id]);
}