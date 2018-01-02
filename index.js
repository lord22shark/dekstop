/**
 *
 */

const fs = require('fs');
const Dekstop = require('./src/index.js');
const {exec} = require('child_process');
const path = require('path');

const port = process.env.DEKSTOP_PORT || process.argv[3];

const dekstoppath = (process.env.DEKSTOP_PATH || process.argv[2] || '../data').trim();
const dekstopport = (!!port) ? parseInt(port.trim()) : 4000;

const filename = [dekstoppath, 'source.np'].join(path.sep);

const gitpath = [dekstoppath, '.git'].join(path.sep);

// TODO: params (exclude on disconect all)

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

	Dekstop.listen(dekstopport);

	console.log(`DEKSTOP server is now listening on port ${dekstopport}...`);

} catch (error) {

	exec(`cd ${dekstoppath} && git init && git add source.np && git commit -m "Welcome!"`, (error, stdout, stderr) => {

		if (error) {

			console.log(`exec error: ${error}`, error);

			return;

		}

		console.log(`stdout: ${stdout}`);

		console.log(`stderr: ${stderr}`, 'warn');

		Dekstop.listen(dekstopport);

		console.log(`DEKSTOP server is now listening on port ${dekstopport}...`);

	});

}
