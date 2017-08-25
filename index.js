/**
 *
 */

const fs = require('fs');
const Dekstop = require('./src/index.js');
const {exec} = require('child_process');
const path = require('path');
const EventLogger = require('node-windows').EventLogger;
const Logger = new EventLogger('Dekstop');

const dekstoppath = (process.env.DEKSTOP_PATH || process.argv[2] || '../data').trim();
const dekstopport = parseInt((process.env.DEKSTOP_PORT || process.argv[3]).trim()) || 4000;

const filename = [dekstoppath, 'source.np'].join(path.sep);

const gitpath = [dekstoppath, '.git'].join(path.sep);

/**
 *
 */
const echo = (message, level) => {

	const output = level || 'info';

	console.log(message);

	Logger[output](message);

};

Dekstop.locals.filename = filename;
Dekstop.locals.path = dekstoppath;

try {

	fs.statSync(dekstoppath);

	try {

		fs.statSync(filename);

	} catch (error) {

		fs.writeFileSync(filename, 'Welcome to Dekstop!');

		echo('Source file created!');

	}

} catch (error) {

	fs.mkdirSync(dekstoppath);

	echo('Data directory created!');

	fs.writeFileSync(filename, 'Welcome to Dekstop!');

	echo('Source file created!');

}

try {

	fs.statSync(gitpath);

	Dekstop.listen(dekstopport);

	echo(`DEKSTOP server is now listening on port ${dekstopport}...`);

} catch (error) {

	exec(`cd ${dekstoppath} && git init && git add source.np && git commit -m "Welcome!"`, (error, stdout, stderr) => {

		if (error) {

			echo(`exec error: ${error}`, error);

			return;

		}

		echo(`stdout: ${stdout}`);

		echo(`stderr: ${stderr}`, 'warn');

		Dekstop.listen(dekstopport);

		echo(`DEKSTOP server is now listening on port ${dekstopport}...`);

	});

}
