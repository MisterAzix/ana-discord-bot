const database = require('@database');
const isMemberMentioned = require('@struct/mention');


module.exports.run = async (bot, msg, args) => {
	let user = isMemberMentioned.run(msg,args,bot);
	if(!user) return msg.reply(`Plusieurs utilisateurs correspondent à l'argument **${args[0]}** veuillez préciser.`);
	let lvl = parseInt(args.slice(user[1]).join(' '));
	if(!lvl) return msg.reply("Erreur dans la commande vérifiez la synthaxe.");
	if(lvl < 1) return msg.reply("La valeur à donner doit être supérieur à 0.");
	database.addLVL(msg, lvl, user[0]);
	msg.reply(lvl + " lvl given to " + user[0].username + " .");
}


module.exports.config = {
	name: "addlvl",
	description : "add lvl to someone.",
	usage: "addlvl (user) <lvl amout>",
	accessibility: ["owner"],
	aliases: ["addl","alvl","al"]
}