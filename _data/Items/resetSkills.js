const pool = require('@pool');
const logger = require('@logger');

exports.use = async (bot,msg,item_id) => {
	let roleArray = [];
	let rank_1 = await pool.query('SELECT rank_1 FROM "Guilds" WHERE guild_id = $1', [msg.guild.id]);
	roleArray.push(rank_1.rows[0].rank_1);
	let rank_2 = await pool.query('SELECT rank_2 FROM "Guilds" WHERE guild_id = $1', [msg.guild.id]);
	roleArray.push(rank_2.rows[0].rank_2);
	let rank_3 = await pool.query('SELECT rank_3 FROM "Guilds" WHERE guild_id = $1', [msg.guild.id]);
	roleArray.push(rank_3.rows[0].rank_3);
	let rank_4 = await pool.query('SELECT rank_4 FROM "Guilds" WHERE guild_id = $1', [msg.guild.id]);
	roleArray.push(rank_4.rows[0].rank_4);
	let rank_5 = await pool.query('SELECT rank_5 FROM "Guilds" WHERE guild_id = $1', [msg.guild.id]);
	roleArray.push(rank_5.rows[0].rank_5);
	let user_skill = await pool.query('SELECT skill_id FROM "SkillUser" WHERE id IN (SELECT id FROM "Users" WHERE user_id = $1 AND guild_id = $2)', [msg.author.id, msg.guild.id]);
	for (row of user_skill.rows) {
		let result = await pool.query('SELECT name FROM "Skills" WHERE id = $1', [row.skill_id]);
		if(msg.guild.roles.find(r => r.name === `${result.rows[0].name}`)) {
			roleArray.push(msg.guild.roles.find(r => r.name === `${result.rows[0].name}`).id);
			roleArray.push(msg.guild.roles.find(r => r.name === `${result.rows[0].name}+`).id);
			roleArray.push(msg.guild.roles.find(r => r.name === `${result.rows[0].name}++`).id);
		}
	}
	pool.query('UPDATE "SkillUser" SET level = 0 WHERE id IN (SELECT id FROM "Users" WHERE user_id = $1 AND guild_id = $2)', [msg.author.id, msg.guild.id]);
	pool.query('UPDATE "Inventory" SET used = true WHERE id = $1', [item_id]);
	let member = msg.guild.members.get(msg.author.id);
	member.removeRoles(member.roles.filter(role => roleArray.includes(role.id)));
	logger(`The $c{magenta:${msg.author.username}}}'s skills have been reset`);
}