const pool = require('@pool');

exports.use = async (bot,msg,item_id) => {
	let clan_host = await pool.query('SELECT clan_id FROM "ClanUser" WHERE user_id IN (SELECT id FROM "Users" WHERE user_id = $1 AND guild_id = $2) AND rank IN (\'leader\',\'admin\')',
		[msg.author.id, msg.guild.id]);
	if(clan_host.rowCount > 0) {
		pool.query('UPDATE "Clans" SET places = places+5 WHERE id = $1', [clan_host.rows[0].clan_id]);
		pool.query('UPDATE "Inventory" SET used = true WHERE id = $1', [item_id]);
	}else {
		return msg.reply(`Vous n'êtes pas admin de l'escouade.`);
	}
}