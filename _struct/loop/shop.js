const pool = require('../database.js');
const logger = require('../logger.js');

module.exports.run = async (bot,guild) => {
	await pool.query('UPDATE "Shop" SET quantity = round(random() * ("Items".refill_max-"Items".refill_min) + "Items".refill_min) FROM "Items" WHERE "Items".id = "Shop".item_id AND guild_id = $1',
		[guild.id]);
	logger(`The shop have been update on $c{magenta:${guild.name}}}.`);
}