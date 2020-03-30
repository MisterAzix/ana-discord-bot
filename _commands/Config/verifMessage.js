const database = require('@database');
const pool = require('@pool');
const auth = require('@struct/auth.js');
const { RichEmbed } = require('discord.js');

module.exports.run = async (bot, msg, args) => {
	let result = await pool.query('SELECT verif_channel, verif_message FROM "Guilds" WHERE guild_id = $1',[msg.guild.id]);
	if(result.rowCount < 1) return msg.delete(3000);
	if(result.rows[0].verif_channel && result.rows[0].verif_message) {
		bot.channels.get(result.rows[0].verif_channel).fetchMessage(result.rows[0].verif_message)
		.then(()=> {
			msg.delete(3000);
		})
		.catch(()=> {
			verifEmbed(bot,msg);
		});
	}else verifEmbed(bot,msg);
}

function verifEmbed (bot, msg) {
	const embed = new RichEmbed()
		.setAuthor("Module D'inscription.")
		.setColor("RANDOM")
		.setThumbnail(`https://cdn4.iconfinder.com/data/icons/basic-ui/512/ui-41-512.png`)
		.setDescription("Il est grand temps, te voilà a deux doigts d'intégrer me repère alors... acceptes-tu le réglement pour ainsi rejoindre le Repère et ses membres ?")
		.setFooter("Message automatique de Ana.",bot.user.displayAvatarURL);
	msg.channel.send({embed}).then(async (message) => {
		await pool.query('UPDATE "Guilds" SET verif_channel = $1, verif_message = $2 WHERE guild_id = $3',[message.channel.id,message.id,message.guild.id]);
		msg.delete(3000);
		auth.run(bot,msg.guild);
	});
}

module.exports.config = {
	name: "verifmessage",
	description : "",
	usage: "",
	accessibility: ["owner"],
	aliases: ["verif","verifmsg","verifmess","vmessage","vmsg"]
}