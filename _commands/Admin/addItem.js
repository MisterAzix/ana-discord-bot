const database = require('@database');
const isMemberMentioned = require('@struct/mention');
const pool = require('@pool');


module.exports.run = async (bot, msg, args) => {
	let user = isMemberMentioned.run(msg,args,bot);
	if(!user) return msg.reply(`Plusieurs utilisateurs correspondent à l'argument **${args[0]}** veuillez préciser.`);
	var items;

	if(parseInt(args.slice(user[1]).join(' '))) {
		items = await pool.query('SELECT id, name, icon, description FROM "Items" WHERE id = $1', [parseInt(args.slice(user[1]).join(' '))]);
	}else {
		items = await pool.query('SELECT id, name, icon, description FROM "Items" WHERE name = $1', [args.slice(user[1]).join(' ')]);
	}
	if(items.rowCount < 1) return msg.reply("Erreur dans la commande vérifiez la synthaxe.");

	database.addItem(msg, items.rows[0].id, user[0]);
	msg.reply(`L'objet "${items.rows[0].icon} ${items.rows[0].name}" a été ajouté à l'inventaire de <@${user[0].id}>`);
}


module.exports.config = {
	name: "additem",
	description : "add item to someone.",
	usage: "additem (user) <item id or name>",
	accessibility: ["owner"],
	aliases: ["aitem"]
}