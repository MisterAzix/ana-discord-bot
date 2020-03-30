const pool = require('./database.js');

module.exports.checkRole = async (guild,user) => {
	let results = await pool.query('SELECT skill_id, level FROM "SkillUser" WHERE id IN (SELECT id FROM "Users" WHERE user_id = $1 AND guild_id = $2)', [user.id, guild.id]);
	results.rows.forEach(async row => {
		let result = await pool.query('SELECT name FROM "Skills" WHERE id = $1', [row.skill_id]);
		let member = guild.members.get(user.id);
		let role_1 = guild.roles.find(r => r.name === `${result.rows[0].name}`);
		let role_2 = guild.roles.find(r => r.name === `${result.rows[0].name}+`);
		let role_3 = guild.roles.find(r => r.name === `${result.rows[0].name}++`);
		if(role_1 && role_2 && role_3) {
			if(row.level >= 5) {
				member.addRole(role_3);
				member.removeRole(role_2);
			}else if(row.level >= 3) {
				member.addRole(role_2);
				member.removeRole(role_1);
			}else if(row.level >= 1) {
				member.addRole(role_1);
			}
		}
	});
}

module.exports.checkRank = async (guild,user) => {
	let results = await pool.query('SELECT skill_id, level FROM "SkillUser" WHERE id IN (SELECT id FROM "Users" WHERE user_id = $1 AND guild_id = $2)', [user.id, guild.id]);
	let skill_survie = results.rows.find(r => r.skill_id === 4)?results.rows.find(r => r.skill_id === 4).level:0;
	let skill_sportif = results.rows.find(r => r.skill_id === 5)?results.rows.find(r => r.skill_id === 5).level:0;
	let skill_intelligence = results.rows.find(r => r.skill_id === 6)?results.rows.find(r => r.skill_id === 6).level:0;
	let skill_gestion = results.rows.find(r => r.skill_id === 7)?results.rows.find(r => r.skill_id === 7).level:0;
	let skill_leader = results.rows.find(r => r.skill_id === 12)?results.rows.find(r => r.skill_id === 12).level:0;

	let member = guild.members.get(user.id);

	//Survie (4) >= 5 / Sportif (5) >= 5 / Intelligence (6) >= 5 / Gestion (7) >= 5 / Leader (12) >= 5
	if(skill_survie >= 5 && skill_sportif >= 5 && skill_intelligence >= 5 && skill_gestion >= 5 && skill_leader >= 5) {
		let result = await pool.query('SELECT rank_5 FROM "Guilds" WHERE guild_id = $1', [guild.id]);
		let role = guild.roles.get(result.rows[0].rank_5);
		return member.addRole(role);
	}
	//Survie (4) >= 4 / Sportif (5) >= 4 / Intelligence (6) >= 4 / Gestion (7) >= 4 / Leader (12) >= 4
	if(skill_survie >= 4 && skill_sportif >= 4 && skill_intelligence >= 4 && skill_gestion >= 4 && skill_leader >= 4) {
		let result = await pool.query('SELECT rank_4 FROM "Guilds" WHERE guild_id = $1', [guild.id]);
		let role = guild.roles.get(result.rows[0].rank_4);
		return member.addRole(role);
	}
	//Survie (4) >= 3 / Sportif (5) >= 4 / Intelligence (6) >= 3 / Gestion (7) >= 2 / Leader (12) >= 3
	if(skill_survie >= 3 && skill_sportif >= 4 && skill_intelligence >= 3 && skill_gestion >= 2 && skill_leader >= 3) {
		let result = await pool.query('SELECT rank_3 FROM "Guilds" WHERE guild_id = $1', [guild.id]);
		let role = guild.roles.get(result.rows[0].rank_3);
		return member.addRole(role);
	}
	//Survie (4) >= 2 / Sportif (5) >= 3 / Intelligence (6) >= 2 / Gestion (7) >= 1 / Leader (12) >= 2
	if(skill_survie >= 2 && skill_sportif >= 3 && skill_intelligence >= 2 && skill_gestion >= 1 && skill_leader >= 2) {
		let result = await pool.query('SELECT rank_2 FROM "Guilds" WHERE guild_id = $1', [guild.id]);
		let role = guild.roles.get(result.rows[0].rank_2);
		return member.addRole(role);
	}
	//Survie (4) >= 2 / Sportif (5) >= 2 / Leader (12) >= 1
	if(skill_survie >= 2 && skill_sportif >= 2 && skill_leader >= 1) {
		let result = await pool.query('SELECT rank_1 FROM "Guilds" WHERE guild_id = $1', [guild.id]);
		let role = guild.roles.get(result.rows[0].rank_1);
		return member.addRole(role);
	}
	

}