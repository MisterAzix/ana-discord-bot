
module.exports.run = async (bot) => {
	bot.guilds.forEach(async guild => {
		let channel = guild.channels.find(c => c.name === 'compteur');
		if(!channel) return;
		let count = parseInt(channel.topic) || 0;
		let collector = channel.createMessageCollector(m => m.author.id !== bot.user.id);
		let last_author = channel.lastMessage?channel.lastMessage.author.id:0;
		collector.on('collect', msg => {
			//console.log(channel.lastMessage.author.id);
			if(msg.content.startsWith((msg.content.length > (count+1).toString().length?`${count+1} `:count+1).toString())) {
				if(last_author !== msg.author.id) {
					count++;
					last_author = msg.author.id;
					channel.setTopic(count.toString());
				}else msg.delete(1000);
			}else msg.delete(1000);
		});
	});
}