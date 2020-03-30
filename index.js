const { Client, Collection } = require('discord.js');
const fs = require('fs');
const ini = require('ini');
const bot = new Client();
const moduleAlias = require('module-alias');

const date = new Date();
fs.appendFile('log.txt', `\n====================[${date.toLocaleString('en-EN', { timeZone: 'Europe/Paris', hour12: false })}]====================\n\n`, function (err) {
	if (err) throw err;
});

console.log(` ======================================== \n \n                LOADING... \n \n ========================================`);

moduleAlias.addAliases({
  '@root'  : __dirname,
  '@struct': __dirname + '/_struct',
  '@data': __dirname + '/_data',
  '@pool': __dirname + '/_struct/database.js',
  '@database': __dirname + '/_struct/function.js',
  '@logger': __dirname + '/_struct/logger.js'
});

const pool = require('@pool');
const logger = require('@logger');

bot.config = ini.parse(fs.readFileSync('./config.ini','utf-8'));

bot.prefix = new Collection();

pool.query('SELECT guild_id, prefix FROM "Guilds"').then(server_prefix => {
	server_prefix.rows.forEach(r => {
		bot.prefix.set(r.guild_id,r.prefix);
	});
});

fs.readdir("./_events/", (err, files) => {

	if(err) console.log(err)

	let jsfile = files.filter(file => file.endsWith(".js"))
	if(jsfile.length <= 0) {
		return logger("Couldn't find any events !");
	}

	jsfile.forEach((file, i) => {
		let event = require("./_events/" + file);
		let eventName = file.split(".")[0];
		bot.on(eventName, event.bind(null, bot));
	});
});

bot.commands = new Collection();

fs.readdir("./_commands/", (err, files) => {

	if(err) console.log(err);

	const main_commands = files.filter(file => file.endsWith(".js"));
	if(main_commands.length <= 0) return console.log(`$c{red:Couldn't find any commands in the main Directory!}}`);
	logger(`Loaded $c{magenta:${main_commands.length}}} commands in the main Directory!`);

	for (file of main_commands) {
		const pull = require(`./_commands/${file}`);
		bot.commands.set(pull.config.name, pull);
	}

	files.filter(file => fs.lstatSync(`./_commands/${file}`).isDirectory()).forEach(dir => {

		const folder_commands = fs.readdirSync(`./_commands/${dir}/`).filter(file => file.endsWith(".js"));
		if(folder_commands.length <= 0) return console.log(`$c{red:Couldn't find any commands in ${dir} Directory!}}`);
		logger(`Loaded $c{magenta:${folder_commands.length}}} commands in ${dir} Directory!`);

		for (file of folder_commands) {
			let pull = require(`./_commands/${dir}/${file}`);
			bot.commands.set(pull.config.name, pull);
		}

	});

});

bot.login(bot.config.TOKEN);