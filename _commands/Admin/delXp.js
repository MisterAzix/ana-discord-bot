const database = require('@database');
const isMemberMentioned = require('@struct/mention');


module.exports.run = async (bot, msg, args) => {
	let user = isMemberMentioned.run(msg,args,bot);
	if(!user) return msg.reply(`Plusieurs utilisateurs correspondent à l'argument **${args[0]}** veuillez préciser.`);
	let xp = parseInt(args.slice(user[1]).join(' '));
	if(!xp) return msg.reply("Erreur dans la commande vérifiez la synthaxe.");
	if(xp < 1) return msg.reply("La valeur à donner doit être supérieur à 0.");
	database.delXP(msg, xp, user[0]);
	msg.reply(xp + " xp taken to " + user[0].username + " .");
}


module.exports.config = {
	name: "delxp",
	description : "del xp to someone.",
	usage: "delxp (user) <xp amout>",
	accessibility: ["owner"],
	aliases: ["dxp"]
}