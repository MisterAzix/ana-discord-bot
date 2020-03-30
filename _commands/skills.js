const { RichEmbed } = require('discord.js');
const pool = require('@pool');
const database = require('@database');
const skills = require('@struct/skills.js');
const logger = require('@logger');

module.exports.run = async (bot, msg, args) => {
	const embed = await genEmbed(msg,0);
	msg.channel.send({embed}).then(message => {

		pool.connect( (err, client, done) => {
			client.query('SELECT icon FROM "Skills"', async (error, result) => {

				let data = result.rows;
				setReact(message, data);
				reaction_list = [];
				for (var i = 0; i < data.length; i++) {
					reaction_list[i] = data[i].icon;
				}
				const collector = message.createReactionCollector((reaction, user) => reaction_list.includes(reaction.emoji.name) && user.username == msg.author.username, { time: 60000 });
				collector.on('collect', async r => {

					const Users = await pool.query('SELECT reputation FROM "Users" WHERE user_id = $1 AND guild_id = $2', [msg.author.id,msg.guild.id])
					const SkillUser = await pool.query('SELECT level FROM "SkillUser" WHERE id IN (SELECT id FROM "Users" WHERE user_id = $1 AND guild_id = $2)', [msg.author.id,msg.guild.id]);
					let skill_point = Users.rows[0].reputation;
					if(SkillUser.rowCount > 0) {
						for (var i = 0; i < SkillUser.rowCount; i++) {
							skill_point -= SkillUser.rows[i].level;
						}
					}

					const level = await pool.query('SELECT level FROM "SkillUser" WHERE id IN (SELECT id FROM "Users" WHERE user_id = $1 AND guild_id = $2) AND skill_id IN (SELECT id FROM "Skills" WHERE icon = $3)',
						[msg.author.id,msg.guild.id,r.emoji.name]);

					if(skill_point <= 0) return message.edit(await genEmbed(msg,1)); //1 : No Skill Point edit
					if(level.rowCount < 1) {
						await pool.query('INSERT INTO "SkillUser" (id,skill_id,level) VALUES ((SELECT id FROM "Users" WHERE user_id = $1 AND guild_id = $2),(SELECT id FROM "Skills" WHERE icon = $3),1) RETURNING level',
							[msg.author.id,msg.guild.id,r.emoji.name]).then(async res => {
								message.edit(await genEmbed(msg,0)); //0 : Normal edit
								logger(`$c{magenta:${msg.author.username}}} levelup the skill ${r.emoji.name} at level $c{magenta:${res.rows[0].level}}} in $c{magenta:${msg.guild.name}}}.`);
							});
					}else if(level.rows[0].level >= 5) {
						message.edit(await genEmbed(msg,2)); //2 : Skill max edit
					}else {
						await pool.query('UPDATE "SkillUser" SET level = level + 1 WHERE id IN (SELECT id FROM "Users" WHERE user_id = $1 AND guild_id = $2) AND skill_id IN (SELECT id FROM "Skills" WHERE icon = $3) RETURNING level',
							[msg.author.id,msg.guild.id,r.emoji.name]).then(async res => {
								message.edit(await genEmbed(msg,0)); //0 : Normal edit
								logger(`$c{magenta:${msg.author.username}}} levelup the skill ${r.emoji.name} at level $c{magenta:${res.rows[0].level}}} in $c{magenta:${msg.guild.name}}}.`);
							});
					}
					skills.checkRole(msg.guild,msg.author);
					skills.checkRank(msg.guild,msg.author);

					r.remove(msg.author);

				});
				collector.on('end', () => {
					msg.delete(1000);
					message.delete(1000);
				});
			});
		});
	});
}

module.exports.config = {
	name: "skills",
	description : "Display your skills menu.",
	usage: "skills",
	accessibility: [""],
	aliases: ["sk"]
}

async function setReact(message,data) {
	for (var i = 0; i < await data.length; i++) {
		await message.react(data[i].icon);
	}
}

async function genEmbed(msg,choice) {

	const results = await pool.query('SELECT id, color, reputation FROM "Users" WHERE user_id = $1 AND guild_id = $2', [msg.author.id,msg.guild.id]);
	let data = results.rows[0];
	const result = await pool.query('SELECT skill_id, level FROM "SkillUser" WHERE id = $1', [data.id]);
	const res = await pool.query('SELECT id, name, icon FROM "Skills"');

	let skill_point = data.reputation
	let skill_level = [];

	if(result.rowCount > 0) {
		for (var i = 0; i < result.rowCount; i++) {
			skill_point -= result.rows[i].level;
			skill_level[(result.rows[i].skill_id)-1] = result.rows[i].level;
		}
	}

	const embed = new RichEmbed()
		.setTitle(`Pour connaître l'utilité de chaque skill rendez-vous dans info-grades-skills.`)
		.setAuthor(`${msg.author.username} 's Skills tree`,msg.author.avatarURL)

		.setColor(data.color || 'RANDOM')
		.setFooter(`Instruction envoyé par ${msg.author.username}`)
		.setThumbnail(msg.author.avatarURL)

		.setTimestamp()
		.setURL(msg.author.avatarURL)

		.addField(`Skill point :`, skill_point, true)
		.addField(`Réputation :`, data.reputation, true)

		.addField(`═══════════════════════════════════════`,`Réagissez avec l\'émoji correspondant pour améliorer votre skill.`);
		
	for (var i = 0; i < res.rowCount; i++) {
		embed.addField(`${res.rows[i].icon} ${res.rows[i].name} :`,`Level ${skill_level[i]?skill_level[i]:0}/5`,true);
	}

	if (choice==1) {
		embed.addField("═══════════════════════════════════════","⚠️ **Vous n'avez pas assez de skill point.**");
	}
	if (choice==2) {
		embed.addField("═══════════════════════════════════════","⚠️ **Le niveau de la compétence est déjà à son maximum.**");
	}

	return embed;
	
}