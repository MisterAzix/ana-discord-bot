const database = require('@database');
const pool = require('@pool');
const logger = require('@logger');
const { RichEmbed } = require('discord.js');

const invites = {};

module.exports = async (bot,member) => {
	welcome(bot,member);
	inviteSystem(bot,member,member.guild);
}

async function welcome(bot,member) {
	logger(`$c{magenta:${member.user.username}}} joined $c{magenta:${member.guild.name}}}.`);
	let channels = await pool.query('SELECT welcome_channel, log_channel FROM "Guilds" WHERE guild_id = $1', [member.guild.id]);
	if(channels.rowCount < 1) return;

	const embed = new RichEmbed()
		.setColor(`RANDOM`)
		.setAuthor(`Log join :`)
		.setTitle(` `)
		.setDescription(`Un nouveau membre du nom de ${member.user.username} (${member.user.id}) à rejoint le serveur, il est le ${member.guild.members.size} eme membre.`)
		.setThumbnail(member.user.displayAvatarURL)
		.setFooter(`Message automatique de Ana.`,bot.user.displayAvatarURL)
		.setTimestamp();

	if(channels.rows[0].log_channel) bot.channels.get(channels.rows[0].log_channel).send({embed});

	embed.setTitle(` `);
	embed.setAuthor(`Bonjour à toi ${member.user.username} ! Tu es le ${member.guild.members.size} eme membre.`);
	embed.setDescription(`Je suis <@${bot.user.id}> le seul et unique bot de ce serveur. Je suis là pour vous surveiller tout comme vous divertir alors n'hésite pas à faire un tour dans les channels d'aide pour tout connaître sur le serveur.`);
	embed.addField(`Amuses toi bien sur Le Repère RV-242 !`,`\u200B`);

	if(channels.rows[0].welcome_channel) bot.channels.get(channels.rows[0].welcome_channel).send({embed});
}

module.exports.updateInviteCache = (bot) => {
	bot.guilds.forEach(g => {
		g.fetchInvites().then(guildInvites => {
			invites[g.id] = guildInvites;
		});
	});
}

async function inviteSystem(bot,member,guild) {
	let results = await pool.query('INSERT INTO "Invites" (user_id,guild_id,time_join) VALUES ($1,$2,$3) ON CONFLICT ON CONSTRAINT "Invites_unique" DO UPDATE SET time_join = EXCLUDED.time_join + 1 WHERE EXCLUDED.user_id = $1 AND EXCLUDED.guild_id = $2 RETURNING *',
		[member.user.id,guild.id,1]);
	if(results.rows[0].time_join > 1) return;
	let existing_invites;
	let invite;
	guild.fetchInvites().then(async guildInvites => {
		existing_invites = invites[guild.id];
		invite = guildInvites.find(inv => (existing_invites.find(i => i.code === inv.code)?existing_invites.find(i => i.code === inv.code).uses:0) < inv.uses);
		invites[guild.id] = guildInvites;

		if(!invite) return;
		inviter = guild.members.get(invite.inviter.id);
		await pool.query('UPDATE "Invites" SET inviter_id = (SELECT id FROM "Users" WHERE user_id = $1 AND guild_id = $2) WHERE user_id = $3 AND guild_id = $2',
			[inviter.user.id,guild.id,member.user.id]);
		logger(`User : $c{magenta:${member.user.username}}} Inviter : $c{magenta:${inviter.user.username}}}`);
		database.addInviteScore(guild,inviter.user);
	});
}