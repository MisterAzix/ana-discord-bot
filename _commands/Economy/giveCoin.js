const database = require('@database');
const pool = require('@pool');
const isMemberMentioned = require('@struct/mention');

module.exports.run = async (bot, msg, args) => {
	let u = isMemberMentioned.run(msg,args,bot);
	if(!u) msg.reply(`Plusieurs utilisateurs correspondent à l'argument **${args[0]}** veuillez préciser.`);
	let user = u[0];
	if(!user) return msg.reply('Veuillez mentionner la personne à qui donner des trombones.');
	if(user.id === msg.author.id) return msg.reply('Vous ne pouvez pas vous donner des trombones à vous même.');
	let coin = parseInt(args[1]);
	if(!coin) return msg.reply('Erreur dans la commande vérifiez la synthaxe.');
	if(coin < 1) return msg.reply('La valeur à donner doit être supérieur à 0.');
	let donator_user = await pool.query('SELECT id FROM "Users" WHERE user_id = $1 AND guild_id = $2 AND coin >= $3',
		[msg.author.id, msg.guild.id, coin]);
	if(donator_user.rowCount < 1) return msg.reply('Le montant de trombones à donner est supérieur à votre nombre de trombones.');
	database.delCoin(msg,coin,msg.author);
	database.addCoin(msg,coin,user);
	msg.reply(`Vous venez de donner ${coin} trombones à <@${user.id}>.`);
}


module.exports.config = {
	name: "givecoin",
	description : "Give coin to somebody.",
	usage: "!givecoin <user>",
	accessibility: [""],
	aliases: ["gcoin","givetrombones","gtrombones"]
}