module.exports.run = (msg,args,bot) => {
	let user = msg.mentions.users.first();
	if(user) return [user, 1];
	if(args && args[0]) {
		let id_match = bot.users.filter(u => u.id === args[0]);
		if(id_match.size > 0) return [id_match.first(), 1];
		let matches = bot.users.filter(u => u.tag.toLowerCase().includes(args[0].toLowerCase()));
		if(matches.size > 1) return false;
		if(matches.size === 1) return [matches.first(), 1];
	}
	return [msg.author, 0];
}