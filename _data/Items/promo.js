const pool = require('@pool');

exports.use = (bot,msg,item_id) => {
	let role = msg.guild.roles.find(r => r.name.toLowerCase() === 'promotion');
	if(role) {
		msg.member.addRol(role);
		pool.query('UPDATE "Inventory" SET used = true WHERE id = $1', [item_id]);
	}else msg.reply('Pas de rôle promotion.');
}