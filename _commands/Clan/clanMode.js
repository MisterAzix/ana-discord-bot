const pool = require('@pool');

module.exports.run = async (bot, msg, args) => {
	let clan_host = await pool.query('SELECT clan_id FROM "ClanUser" WHERE user_id IN (SELECT id FROM "Users" WHERE user_id = $1 AND guild_id = $2) AND rank IN (\'leader\',\'admin\')',
		[msg.author.id, msg.guild.id]);
	if(clan_host.rowCount < 1) return msg.reply(`Vous n'êtes pas admin d'une escouade.`);
	if(args[0]) {
		let mode;
		switch (args[0].toString()) {
			case 'open':
				mode = 0;
				msg.reply(`L'escouade est maintenant ouverte à tous.`);
				break;
			case 'invite':
				mode = 1;
				msg.reply(`L'escouade est maintenant sur invitation.`);
				break;
			case 'close':
				mode = 2;
				msg.reply(`L'escouade est maintenant fermée.`);
				break;
			default:
				return msg.reply(`Ce mode n'existe pas.`);
				break;
		}
		await pool.query('UPDATE "Clans" SET mode = $1 WHERE id = $2', [mode,clan_host.rows[0].clan_id]);
	}else msg.reply(`Veuillez préciser un mode.`);
}


module.exports.config = {
	name: "clanmode",
	description : "Change the mode of a clan.",
	usage: "clanmode <mode>",
	accessibility: ["skill",12,3],
	aliases: ["clanm"]
}