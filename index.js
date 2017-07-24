/**
 *
 */

const fs = require('fs');
const Dekstop = require('./src/index.js');
const {exec} = require('child_process');
const path = require('path');

const dekstoppath = (process.argv[2] || process.env.DEKSTOP_PATH || '../data').trim();

const filename = [dekstoppath, 'source.np'].join(path.sep);

const gitpath = [dekstoppath, '.git'].join(path.sep);

Dekstop.locals.filename = filename;
Dekstop.locals.path = dekstoppath;

try {

	fs.statSync(dekstoppath);

	try {

		fs.statSync(filename);

	} catch (error) {

		fs.writeFileSync(filename, 'Welcome to Dekstop!');

		console.log('Source file created!');

	}

} catch (error) {

	fs.mkdirSync(dekstoppath);

	console.log('Data directory created!');

	fs.writeFileSync(filename, 'Welcome to Dekstop!');

	console.log('Source file created!');

}

try {

	fs.statSync(gitpath);

	Dekstop.listen(4000);

	console.log('Listening...');

} catch (error) {

	exec(`cd ${dekstoppath} && git init && git add source.np && git commit -m "Welcome!"`, (error, stdout, stderr) => {

		if (error) {

			console.error(`exec error: ${error}`);

			return;

		}

		console.log(`stdout: ${stdout}`);

		console.log(`stderr: ${stderr}`);

		Dekstop.listen(4000);

		console.log('Listening...');

	});

}
