/**
 * DEKSTOP 2.0
 */

/**
 * Startup Environment Variables
 */
require('dotenv').config();

/**
 * External Dependencies
 */
const fs = require('fs');
const {exec} = require('child_process');
const path = require('path');

/**
 * Internal Dependencies
 */
const Dekstop = require('./src/index.js');

const DEKSTOP_PATH = process.env.DEKSTOP_PATH;
const DEKSTOP_PORT = process.env.DEKSTOP_PORT;
const DEKSTOP_GIT_NAME = process.env.DEKSTOP_GIT_NAME;
const DEKSTOP_GIT_EMAIL = process.env.DEKSTOP_GIT_EMAIL;

const gitpath = path.join(DEKSTOP_PATH, '.git');

Dekstop.locals.git = gitpath;
Dekstop.locals.path = DEKSTOP_PATH;
Dekstop.locals.fullpath = path.resolve(DEKSTOP_PATH);

try {

	fs.statSync(DEKSTOP_PATH);

	console.log('Dekstop started!');

} catch (error) {

	fs.mkdirSync(DEKSTOP_PATH);

	console.log('Data directory created!');

	console.log('Dekstop started!');

}

try {

	fs.statSync(gitpath);

	Dekstop.listen(DEKSTOP_PORT);

	console.log(`DEKSTOP server is now listening on port ${DEKSTOP_PORT}...`);

} catch (error) {

	const commands = [
		`cd ${DEKSTOP_PATH}`,
		`git init`,
		`git config user.name "${DEKSTOP_GIT_NAME}"`,
		`git config user.email "${DEKSTOP_GIT_EMAIL}"`
	];

	exec(commands.join(' && '), (error, stdout, stderr) => {

		if (error) {

			console.log(`exec error: ${error}`, error);

			return;

		}

		Dekstop.listen(DEKSTOP_PORT);

		console.log(`DEKSTOP server is now listening on port ${DEKSTOP_PORT}...`);

	});

}
