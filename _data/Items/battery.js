const pool = require('@pool');

exports.use = (bot,msg,item_id) => {
	return msg.reply('Cet item est à utiliser directement dans le menu des mineurs.');
}