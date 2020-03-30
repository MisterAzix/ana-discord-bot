const database = require('@database');
const isMemberMentioned = require('@struct/mention');


module.exports.run = async (bot, msg, args) => {
	let user = isMemberMentioned.run(msg,args,bot);
	if(!user) return msg.reply(`Plusieurs utilisateurs correspondent à l'argument **${args[0]}** veuillez préciser.`);
	let coin = parseInt(args.slice(user[1]).join(' '));
	if(!coin) return msg.reply("Erreur dans la commande vérifiez la synthaxe.");
	if(coin < 1) return msg.reply("La valeur à donner doit être supérieur à 0.");
	database.addCoin(msg, coin, user[0]);
	msg.reply(coin + " coins taken to " + user[0].username + " .");
}


module.exports.config = {
	name: "delcoin",
	description : "del coin to someone.",
	usage: "delcoin (user) <coin amout>",
	accessibility: ["owner"],
	aliases: ["delc","dcoin","dc"]
}