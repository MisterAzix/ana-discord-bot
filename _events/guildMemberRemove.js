const pool = require('@pool');
const logger = require('@logger');

module.exports = async (bot,member) => {
	logger(`$c{magenta:${member.user.username}}} left $c{magenta:${member.guild.name}}}.`);
	let clan_user = await pool.query('SELECT user_id, clan_id, rank FROM "ClanUser" WHERE user_id IN (SELECT id FROM "Users" WHERE user_id = $1 AND guild_id = $2) AND rank NOT IN (\'invited\')', [member.user.id, member.guild.id]); //Check if the user have a Clan
	if(clan_user.rowCount < 1) return;
	if(clan_user.rows[0].rank === 'leader') {
		let clan = await pool.query('SELECT user_id FROM "ClanUser" WHERE clan_id = $1 AND rank IN (\'member\',\'admin\') ORDER BY rank ASC, reputation DESC, xp DESC LIMIT 1', [clan_user.rows[0].clan_id]); //Get the highet member of the Clan
		if(clan.rowCount > 0) {
			await pool.query('UPDATE "ClanUser" SET rank = \'leader\' WHERE user_id = $1', [clan.rows[0].user_id, clan_user.rows[0].clan_id]); //Give the lead to the highest member of the Clan
		}else {
			let clan_name = await pool.query('DELETE FROM "Clans" WHERE id = $1 RETURNING name', [clan_user.rows[0].clan_id]); //Disband the Clan
			logger(`The clan $c{magenta:${name}}} on $c{magenta:${member.guild.name}}} was disband.`);
		}
	await pool.query('DELETE FROM "ClanUser" WHERE user_id = $1', [clan_user.rows[0].user_id]); //Delete the user from the Clan Table
	}
}