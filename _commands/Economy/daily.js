const pool = require('@pool');
const database = require('@database');
const logger = require('@logger');

module.exports.run = async (bot, msg, args) => {
	let date = new Date();
	let delay = 82800000;

	let user_data = await pool.query('SELECT reputation, date_daily, combo_daily FROM "Users" WHERE user_id = $1 AND guild_id = $2',
		[msg.author.id, msg.guild.id]);
	let user_skill = await pool.query('SELECT level FROM "SkillUser" WHERE id IN (SELECT id FROM "Users" WHERE user_id = $1 AND guild_id = $2) AND skill_id = 9',
		[msg.author.id, msg.guild.id]);
	let updated_user;

	if(user_data.rowCount < 1) return;
	if(date.getTime() > parseInt(user_data.rows[0].date_daily) + delay) {
		if(date.getTime() > parseInt(user_data.rows[0].date_daily) + delay*2)
			updated_user = await pool.query('UPDATE "Users" SET combo_daily = 0 WHERE id IN (SELECT id FROM "Users" WHERE user_id = $1 AND guild_id = $2) RETURNING reputation, date_daily, combo_daily',
				[msg.author.id, msg.guild.id]);
		let { reputation, date_daily, combo_daily } = updated_user?updated_user.rows[0]:user_data.rows[0];

		let xpReward = Math.round(((40+combo_daily*10)*(1/(reputation/10+1))<=2?2:(40+combo_daily*10)*(1/(reputation/10+1)))/100*reputation*100);
		let coinReward = 200*(user_skill.rowCount > 0?user_skill.rows[0].level*0.2+1:1);
		
		let combo = await pool.query('UPDATE "Users" SET combo_daily = combo_daily+1 WHERE id IN (SELECT id FROM "Users" WHERE user_id = $1 AND guild_id = $2) AND combo_daily <= 10 RETURNING combo_daily',
			[msg.author.id, msg.guild.id]);
		await pool.query('UPDATE "Users" SET date_daily = $3 WHERE id IN (SELECT id FROM "Users" WHERE user_id = $1 AND guild_id = $2)',
			[msg.author.id, msg.guild.id,date.getTime()]);

		database.addXP(msg,xpReward,msg.author);
		database.addCoin(msg,coinReward,msg.author);
		logger(`$c{magenta:${msg.author.username}}} claimed his daily reward on $c{magenta:${msg.guild.name}}}.`);
		msg.reply(`Vous obtenez ${xpReward} points d'expériences et ${coinReward} trombones. Votre combo : ${combo.rowCount > 0?combo.rows[0].combo_daily:combo_daily}`);
	}else {
		let restH = Math.floor((parseInt(user_data.rows[0].date_daily) + delay - date.getTime())/3600000);
		let restM = Math.floor((parseInt(user_data.rows[0].date_daily) + delay - date.getTime())/60000)%60;
		let restS = Math.round((parseInt(user_data.rows[0].date_daily) + delay - date.getTime())/1000)%60;
		msg.reply(`⚠ Récompense du jour déjà reçue. **${restH}h ${restM}m ${restS}s** avant la prochaine récompense.`);
	}
}


module.exports.config = {
	name: "daily",
	description : "Claim your daily reward.",
	usage: "daily",
	accessibility: [""],
	aliases: ["day"]
}