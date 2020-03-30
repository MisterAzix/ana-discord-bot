const database = require('@database');
const pool = require('@pool');
const { createCanvas, loadImage } = require('canvas');
const { Attachment } = require('discord.js');
const isMemberMentioned = require('@struct/mention');
const drawMultilineText = require('canvas-multiline-text');

module.exports.run = async (bot, msg, args) => {

	let u = isMemberMentioned.run(msg,args,bot);
	if(!u) return msg.reply(`Plusieurs utilisateurs correspondent à l'argument **${args[0]}** veuillez préciser.`);
	let user = u[0];
	let member = msg.guild.members.find(a => a.id === user.id);

	pool.connect( (err, client, done) => {
		client.query('SELECT matricule, description, gender, color, reputation, xp, coin FROM "Users" WHERE user_id = $1 AND guild_id = $2', [user.id,msg.guild.id], async (error, results) => {
			if(error) return console.log(error);
			if(results.rowCount < 1) {
				return msg.reply('Cet utilisateur n\'a pas de profil.');
			}else {
				data = results.rows[0];

				const canvas = createCanvas(500, 500);
				const ctx = canvas.getContext('2d');

				const background = await loadImage(user.displayAvatarURL).catch(async () => {
					return await loadImage(msg.guild.iconURL);
				});
				ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

				ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
				ctx.fillRect(0, 0, canvas.width, canvas.height);

				ctx.drawImage(background, (canvas.width/2)-33, 45, 66, 66);

				const base = await loadImage('./assets/profile.png');
				ctx.drawImage(base, 0, 0, canvas.width, canvas.height);

				ctx.textAlign = "center";
				ctx.fillStyle = 'rgba(255, 255, 255, 1)';
				ctx.font = '18px Bahnschrift';
				ctx.fillText(data.matricule, 100, 85);
				ctx.fillText(user.username, 400, 85);

				if(data.description) {
					ctx.fillStyle = 'rgba(70, 70, 70, 1)';
					drawMultilineText(ctx, data.description, {
						rect: {
							x: 250, 
							y: 130,
							width: 410,
							height: 50
						},
						font: 'Bahnschrift',
						minFontSize: 16,
						maxFontSize: 25
					});
				}

				if(user.id === '274524294392840192') {
					let gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
					gradient.addColorStop(0, '#ff0000');
					gradient.addColorStop(0.6, '#bb45ff');
					gradient.addColorStop(0.80, '#8a45ff');
					gradient.addColorStop(1, '#5f00ff');
					ctx.fillStyle = gradient;
				}else if(msg.guild.members.get(user.id).hasPermission('ADMINISTRATOR')) {
					let gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
					gradient.addColorStop(0, '#ffff00');
					gradient.addColorStop(0.3, '#ff6600');
					gradient.addColorStop(0.7, '#ff00ff');
					gradient.addColorStop(1, '#6600ff');
					ctx.fillStyle = gradient;
				}else {
					ctx.fillStyle = data.color?`#${data.color}`:`#3399ff`;
				}
				ctx.fillRect(51, 272, xpBar(data.xp,data.reputation), 17);

				ctx.fillStyle = 'rgba(0, 0, 0, 1)';
				ctx.font = '15px Bahnschrift';
				ctx.fillText('XP : ' + data.xp + '/' + ((data.reputation*100)+100), 250, 286);

				const SkillUser = await pool.query('SELECT level FROM "SkillUser" WHERE id IN (SELECT id FROM "Users" WHERE user_id = $1 AND guild_id = $2)', [user.id,msg.guild.id]);
				let skill_point = data.reputation;
				if(SkillUser.rowCount > 0) {
					for (var i = 0; i < SkillUser.rowCount; i++) {
						skill_point -= SkillUser.rows[i].level;
					}
				}

				ctx.textAlign = "start";
				ctx.fillStyle = 'rgba(70, 70, 70, 1)';
				ctx.font = '20px Bahnschrift';
				ctx.fillText('Niveau ' + data.reputation + ' de reputation', 60, 265);
				ctx.font = '23px Bahnschrift';
				ctx.fillText(member.hoistRole?member.hoistRole.name:'Réfugié', 95, 337);
				ctx.fillText((data.gender?data.gender:'Non défini'), 300, 337);
				ctx.fillText(data.coin, 95, 387);
				ctx.fillText(skill_point, 300, 387);

				ctx.font = '15px Bahnschrift';
				ctx.fillText('© 2019 Maxence "MisterAzix".', 45, 460);

				ctx.textAlign = "end";
				let time = new Date()
				time = (time.getHours() < 10?'0'+time.getHours():time.getHours()) + ':' + (time.getMinutes() < 10?'0'+time.getMinutes():time.getMinutes()) + ':' + (time.getSeconds() < 10?'0'+time.getSeconds():time.getSeconds());
				ctx.fillText(time, 450, 460);

				const attachment = new Attachment(canvas.toBuffer(), `${msg.author.id}.png`);
				msg.channel.send(attachment);
			}
			done(err);
		});
	});

}

function xpBar(xp,lvl) {
	value = Math.round(398*(xp/(lvl*100+100)));
	value = (value >= 398?398:value);
	return value;
}

module.exports.config = {
	name: "profile",
	description : "Display your profile.",
	usage: "profile",
	accessibility: [""],
	aliases: ["pf","profil"]
}