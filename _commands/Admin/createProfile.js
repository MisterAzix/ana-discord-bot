const database = require('@database');
const isMemberMentioned = require('@struct/mention');

module.exports.run = async (bot, msg, args) => {
	let u = isMemberMentioned.run(msg,args,bot);
	if(!u) return msg.reply(`Plusieurs utilisateurs correspondent à l'argument **${args[0]}** veuillez préciser.`);
	let user = u[0];

	database.profileCreate(msg, user, msg.guild);
}


module.exports.config = {
	name: "createprofile",
	description : "Create a profile",
	usage: "createprofile <user>",
	accessibility: ["owner"],
	aliases: ["cp","cpf","createpf","cprofile"]
}