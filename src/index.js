/**
 * Express Dekstop Server
 */

/**
 * External Dependencies
 */
const express = require('express');
const fs = require('fs');
const chokidar = require('chokidar');
const md5 = require('md5');
const {exec} = require('child_process');
const Dekstop = express();
const expressWs = require('express-ws')(Dekstop);
const Entities = new require('html-entities').AllHtmlEntities;

/**
 * Internal Dependencies
 */
const {parser} = require('./utils/index.js');


/**
 *
 */
Dekstop.use('/', express.static('./src/static'));
Dekstop.use('/highlightjs', express.static('./node_modules/highlightjs'));
Dekstop.use('/toastr', express.static('./node_modules/toastr/build'));
Dekstop.use('/jquery', express.static('./node_modules/jquery/dist'));

/**
 *
 */
Dekstop.ws('/raw', (ws, request) => {

	/**
	 *
	 */
	ws.on('message', (message) => {

		var parsedMessage = JSON.parse(message);

		fs.writeFile(request.app.locals.filename, parsedMessage.value, (error) => {

			if (error) {

				console.error(error);

				return;

			}

			if (parsedMessage.commit === true) {

				let command = `cd ${request.app.locals.path} && git add -u * && git commit -m "Automatic update."`;

				exec(command, (giterror) => {

					if (giterror) {

						Logger.error(`GIT EXECUTION ERROR: ${giterror}`);

						console.error(`GIT EXECUTION ERROR: ${giterror}`);

					}

				});

			}

		}); 

	});

	// Starting...
	fs.readFile(request.app.locals.filename, {encoding: 'utf8', flag: 'r'}, (error, source) => {

		let output = source.toString();

		if (error) {

			output = error.message;

		}

		ws.send(output);

	});

});

/**
 *
 */
Dekstop.ws('/rendered', (ws, request) => {

	const readerWatcher = chokidar.watch(request.app.locals.filename, {persistent: true});

	/**
	 *
	 */
	readerWatcher.on('change', (filename, details) => {

		// Starting...
		fs.readFile(request.app.locals.filename, {encoding: 'utf8', flag: 'r'}, (error, source) => {

			let output = parser(source.toString());

			if (error) {

				output = error.message;

			}

			ws.send(output);

		});

	});

	/**
	 *
	 */
	ws.on('close', () => {

		console.log('Client closed socket connection!');

		readerWatcher.close();

	});


	// Starting...
	fs.readFile(request.app.locals.filename, {encoding: 'utf8', flag: 'r'}, (error, source) => {

		let output = parser(source.toString());

		if (error) {

			output = error.message;

		}

		ws.send(output);

	});

});

module.exports = Dekstop;
