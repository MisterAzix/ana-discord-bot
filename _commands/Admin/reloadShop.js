const shop = require('@struct/loop/shop.js');
const pool = require('@pool');

module.exports.run = async (bot, msg, args) => {
	let date = new Date();
	let shop_time = 86400000 + date.getTime();
	await pool.query('UPDATE "Guilds" SET shop_time = $1 WHERE guild_id = $2', [shop_time,msg.guild.id]);
	shop.run(bot,msg.guild);
	msg.reply('Le shop a été rechargé.');
}

module.exports.config = {
	name: "reloadshop",
	description : "Reload the shop.",
	usage: "reloadshop",
	accessibility: ["owner"],
	aliases: ["rlshop"]
}