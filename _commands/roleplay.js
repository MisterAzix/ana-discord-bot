module.exports.run = async (bot, msg, args) => {
	return msg.reply('De retour le lus rapidement possible !');
}

module.exports.config = {
	name: "roleplay",
	description : "Join the RP.",
	usage: "roleplay (role_name)",
	accessibility: [""],
	aliases: ["rp"]
}