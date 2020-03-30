const pool = require('../database.js');
const logger = require('../logger.js');

module.exports.run = async (bot,guild) => {
	let EventGuild = await pool.query('SELECT status FROM "EventGuild" WHERE guild_id = $1', [guild.id]);
	if(!EventGuild.rows[0].status) {
		let eventChoice = await pool.query('SELECT id, name, script_ref FROM "Events" ORDER BY random() LIMIT 1');
		let event = require(`../../_data/Events/${eventChoice.rows[0].script_ref}.js`);
		event.start(bot,guild,eventChoice.rows[0].id);
		await pool.query('UPDATE "EventGuild" SET status = true, event_id = $1 WHERE guild_id = $2', [eventChoice.rows[0].id,guild.id]);
	}
}