const pool = require('@pool');

module.exports.run = async (bot, msg, args) => {
	let result = await pool.query('SELECT clan_id, rank FROM "ClanUser" WHERE user_id IN (SELECT id FROM "Users" WHERE user_id = $1 AND guild_id = $2)',
		[msg.author.id, msg.guild.id]);
	if(result.rowCount > 0) {
		if(result.rows[0].rank != 'invited') return msg.reply(`Tu fais déjà parti d'une escouade.`);
	}
	let clan;
	if(parseInt(args[0])) {
		clan = await pool.query('SELECT id, name, mode, role_id FROM "Clans" WHERE id = $1', [parseInt(args[0])]);
	}else {
		clan = await pool.query('SELECT id, name, mode, role_id FROM "Clans" WHERE name ILIKE $1', [args.join(' ')]);
	}
	if(clan.rowCount < 1) return msg.reply(`Aucune escouade du nom de ${args.join(' ')} n'a été trouvé.`);
	switch(clan.rows[0].mode) {
		case 0:
			await pool.query('INSERT INTO "ClanUser" (user_id, clan_id, rank) VALUES ((SELECT id FROM "Users" WHERE user_id = $1 AND guild_id = $2),$3,$4)',
				[msg.author.id, msg.guild.id, clan.rows[0].id, "member"]);
			let role = msg.guild.roles.get(clan.rows[0].role_id);
			msg.member.addRole(role);
			msg.reply(`Bienvenue à toi dans ${clan.rows[0].name}.`);
			break;
		case 1:
			if(result.rows.find(r => r.clan_id === clan.rows[0].id)) {
				await pool.query('UPDATE "ClanUser" SET rank = \'member\' WHERE user_id IN (SELECT id FROM "Users" WHERE user_id = $1 AND guild_id = $2) AND clan_id = $3',
					[msg.author.id, msg.guild.id, clan.rows[0].id]);
				let role = msg.guild.roles.get(clan.rows[0].role_id);
				msg.member.addRole(role);
				msg.reply(`Bienvenue à toi dans ${clan.rows[0].name}.`);
			}
			else return msg.reply(`Vous devez être invité pour rejoindre cette escouade.`);
			break;
		case 2:
			return msg.reply(`L'escouade est fermé tu ne peux pas la rejoindre.`);
			break;
		default:
			break;
	}
}


module.exports.config = {
	name: "clanjoin",
	description : "Join a clan.",
	usage: "clanjoin <nom ou id du clan>",
	accessibility: ["skill",12,1],
	aliases: ["cjoin"]
}