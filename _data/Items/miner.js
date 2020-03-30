const pool = require('@pool');

exports.use = (bot,msg,item_id) => {
	//if(msg.author.id !== '177506696174895104') return;
	pool.query('INSERT INTO "generator" (item_id,user_id) VALUES ($1,(SELECT id FROM "Users" WHERE user_id = $2 AND guild_id = $3))',
		[item_id,msg.author.id,msg.guild.id]).then(() => {
			pool.query('UPDATE "Inventory" SET used = true WHERE id = $1', [item_id]);
			msg.reply('Un nouveau mineur a été ajouté à votre baie de stockage.');
		});
}