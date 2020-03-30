const pool = require('./database.js');
const invite = require('../_events/guildMemberAdd.js');
const event = require('./loop/event.js');
const shop = require('./loop/shop.js');
const miner = require('./loop/miner.js');

module.exports.run = (bot) => {
	minerChecker();
	bot.guilds.forEach(guild => {
		pool.query('UPDATE "EventGuild" SET status = false, event_id = 0 WHERE guild_id = $1', [guild.id]);
		inviteChecker(bot,guild);
		eventChecker(bot,guild);
		shopChecker(bot,guild);
	});
}

function inviteChecker(bot, guild) {
	invite.updateInviteCache(bot);
	setTimeout(()=>inviteChecker(bot,guild),180000);
}


async function eventChecker(bot, guild) {
	let event_channel = await pool.query('SELECT guild_id FROM "Guilds" WHERE guild_id = $1 AND event_channel != \'0\'', [guild.id]);
	if(event_channel.rowCount < 1) return;
	let EventGuild = await pool.query('SELECT min_delay, max_delay, event_time, status FROM "EventGuild" WHERE guild_id = $1', [guild.id]);
	if(Date.now() > EventGuild.rows[0].event_time && !EventGuild.rows[0].status) {
		let event_time = getRandomInt(parseInt(EventGuild.rows[0].max_delay)-parseInt(EventGuild.rows[0].min_delay)) + parseInt(EventGuild.rows[0].min_delay) + Date.now();
		await pool.query('UPDATE "EventGuild" SET event_time = $1 WHERE guild_id = $2 AND status = false', [event_time,guild.id]);
		event.run(bot,guild);
	}
	setTimeout(()=>eventChecker(bot,guild),60000);
}

async function shopChecker(bot, guild) {
	let time = await pool.query('SELECT shop_time FROM "Guilds" WHERE guild_id = $1', [guild.id]);
	if(time.rowCount < 1) return;
	if(Date.now() > time.rows[0].shop_time) {
		let shop_time = 86400000/2 + Date.now();
		await pool.query('UPDATE "Guilds" SET shop_time = $1 WHERE guild_id = $2', [shop_time,guild.id]);
		shop.run(bot,guild);
	}
	setTimeout(()=>shopChecker(bot,guild),300000);
}

function minerChecker() {
	miner.run();
	setTimeout(()=>minerChecker(),600000);
}

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}