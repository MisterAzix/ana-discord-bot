const pool = require('@pool');
const database = require('@database');
const logger = require('@logger');

module.exports.run = async (bot, msg, args) => {
	let date = new Date();
	let delay = 3600000;

	let user_data = await pool.query('SELECT reputation, date_hourly, combo_hourly FROM "Users" WHERE user_id = $1 AND guild_id = $2',
		[msg.author.id, msg.guild.id]);
	let user_skill = await pool.query('SELECT level FROM "SkillUser" WHERE id IN (SELECT id FROM "Users" WHERE user_id = $1 AND guild_id = $2) AND skill_id = 9',
		[msg.author.id, msg.guild.id]);
	let updated_user;

	if(user_data.rowCount < 1) return;
	if(date.getTime() > parseInt(user_data.rows[0].date_hourly) + delay) {
		if(date.getTime() > parseInt(user_data.rows[0].date_hourly) + delay*2) 
			updated_user = await pool.query('UPDATE "Users" SET combo_hourly = 0 WHERE id IN (SELECT id FROM "Users" WHERE user_id = $1 AND guild_id = $2) RETURNING reputation, date_hourly, combo_hourly',
				[msg.author.id, msg.guild.id]);
		let { reputation, date_hourly, combo_hourly } = updated_user?updated_user.rows[0]:user_data.rows[0];

		let xpReward = Math.round(((4+combo_hourly)*(1/(reputation/10+1))<=0.2?0.2:(4+combo_hourly)*(1/(reputation/10+1)))/100*reputation*100);
		let coinReward = 20*(user_skill.rowCount > 0?user_skill.rows[0].level*0.2+1:1);
		
		let combo = await pool.query('UPDATE "Users" SET combo_hourly = combo_hourly+1 WHERE id IN (SELECT id FROM "Users" WHERE user_id = $1 AND guild_id = $2) AND combo_hourly <= 15 RETURNING combo_hourly',
			[msg.author.id, msg.guild.id]);
		await pool.query('UPDATE "Users" SET date_hourly = $3 WHERE id IN (SELECT id FROM "Users" WHERE user_id = $1 AND guild_id = $2)',
			[msg.author.id, msg.guild.id,date.getTime()]);

		database.addXP(msg,xpReward,msg.author);
		database.addCoin(msg,coinReward,msg.author);
		logger(`$c{magenta:${msg.author.username}}} claimed his hourly reward on $c{magenta:${msg.guild.name}}}.`);
		msg.reply(`Vous obtenez ${xpReward} points d'expériences et ${coinReward} trombones. Votre combo : ${combo.rowCount > 0?combo.rows[0].combo_hourly:combo_hourly}`);
	}else {
		let restM = Math.floor((parseInt(user_data.rows[0].date_hourly) + delay - date.getTime())/60000);
		let restS = Math.round((parseInt(user_data.rows[0].date_hourly) + delay - date.getTime())/1000)%60;
		msg.reply(`⚠ Récompense de l'heure déjà reçue. **${restM}m ${restS}s** avant la prochaine récompense.`);
	}
}


module.exports.config = {
	name: "hourly",
	description : "Claim your hourly reward.",
	usage: "hourly",
	accessibility: [""],
	aliases: ["hour","hr"]
}