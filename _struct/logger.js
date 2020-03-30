const fs = require('fs');

module.exports = (message) => {

	const regex = /\$c{([a-z]+):(.+?)}}/gm;
	let m;
	let log = message;

	let time = new Date()
	time = (time.getHours() < 10?'0'+time.getHours():time.getHours()) + ':' + (time.getMinutes() < 10?'0'+time.getMinutes():time.getMinutes()) + ':' + (time.getSeconds() < 10?'0'+time.getSeconds():time.getSeconds());

	while ((m = regex.exec(message)) !== null) {
		if (m.index === regex.lastIndex) {
			regex.lastIndex++;
		}
		switch (m[1]) {
			case 'magenta':
				message = message.replace(m[0], `\x1b[35m${m[2]}\x1b[0m`);
				break;
			case 'blue':
				message = message.replace(m[0], `\x1b[34m${m[2]}\x1b[0m`);
				break;
			case 'red':
				message = message.replace(m[0], `\x1b[31m${m[2]}\x1b[0m`);
				break;
			case 'green':
				message = message.replace(m[0], `\x1b[32m${m[2]}\x1b[0m`);
				break;
			default:
				break;
		}
		log = log.replace(m[0], `${m[2]}`);
	}
	
	fs.appendFile('log.txt', `[${time}] : ${log}\n`, function (err) {
		if (err) throw err;
	});
	console.log(`[${time}] : ${message}`);

}

//Utilisation : logger(Some text $c{color:Some text colored}} Some text)