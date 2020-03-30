const pool = require('@pool');

module.exports.run = async (bot, msg, args) => {

	let gender;
	if(!args[0]) return;
	if(args[0].toLowerCase() === 'masculin' || args[0].toLowerCase() === 'm') {
		gender = 'Masculin';
	}else if(args[0].toLowerCase() === 'féminin' || args[0].toLowerCase() === 'f') {
		gender = 'Féminin';
	}else if(args[0].toLowerCase() === 'autre' || args[0].toLowerCase() === 'a') {
		gender = 'Autre';
	}else {
		return msg.reply("Veuillez définir un genre valide.");
	}

	pool.connect( (err, client, done) => {
        //Update the user gender
        client.query('UPDATE "Users" SET gender = $1 WHERE user_id = $2 AND guild_id = $3', [gender, msg.author.id, msg.guild.id], (err, result) => {
        	if(err) return console.log(err);
        	if(result.rowCount < 1) {
        		return msg.reply('⚠️ Vous n\'avez pas les compétences requises pour exécuter cette instruction.');
        	}else {
        		return msg.reply('Genre mis à jour.');
        	}
            done(err);
        });
    });

}


module.exports.config = {
	name: "setgender",
	description : "change your gender on your profile.",
	usage: "setgender M/F/A",
	accessibility: ["skill",8,1],
	aliases: ["setg","sgender","setsex"]
}