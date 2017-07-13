/**
 *
 */

const express = require('express');
const Dekstop = express();
const expressWs = require('express-ws')(Dekstop);
const fs = require('fs');
const chokidar = require('chokidar');

const parser = (source) => {

	const tagPattern = /\/\@\s{1}\[([A-Z0-9a-z\-\_]+)\]([^]*?)\[\@\\/gm;
	const hourPattern = /\/\@\s{1}\((\d{4}\-\d{2}\-\d{2}\s{1}\d{2}\:\d{2}\:\d{2})\)([^]*?)\(\@\\/gm;
	const codePattern = /\/\@\s{1}\{([A-Z0-9a-z\-\_\+\#]+)\}([^]*?)\{\@\\/gm;
	const shortHourPattern = /\(\[\{H(\d+)\}\]\)/g;
	const shortCodePattern = /\(\[\{C(\d+)\}\]\)/g;

	const tagMatches = []; 

	let html = [];

	// ---
	let tagMatch;

	while ((tagMatch = tagPattern.exec(source)) != null) {

		let updated = tagMatch[2];

		tagMatches.push(tagMatch);

		let hourMatch;

		let hourMatches = [];

		let hourIndex = 0;

		while ((hourMatch = hourPattern.exec(tagMatch[2])) != null) {

			hourMatches.push(hourMatch);

			updated = updated.replace(hourMatch[0], `([{H${hourIndex}}])`);

			hourIndex++;

		}

		// Codes
		let codeMatch;

		let codeMatches = [];

		let matchIndex = 0;

		while ((codeMatch = codePattern.exec(tagMatch[2])) != null) {

			codeMatches.push(codeMatch);

			updated = updated.replace(codeMatch[0], `([{C${matchIndex}}])`);

			matchIndex++;

		}

		// to HTML

		let lines = updated.split(/[\r\n]+/g);

		lines = lines.map((line) => {

			let copy = new String(line);

			if ((copy) && (copy != '')) {

				let shortHourMatch;

				while ((shortHourMatch = shortHourPattern.exec(copy)) != null) {

					let index = parseInt(shortHourMatch[1]);

					copy = copy.replace(`([{H${index}}])`, `<span data-when="${hourMatches[index][1]}">${hourMatches[index][2]}</span>`);

				}

				if (shortCodePattern.test(copy)) {

					let index = parseInt(copy.replace(/\D+/g, ''));

					copy = `<pre><code lang="${codeMatches[index][1]}">${codeMatches[index][2]}</code></pre>`;

				} else if (line[0] === '\t') {

					copy = `<blockquote>${copy}</blockquote>`;

				} else {

					copy = `<p>${copy}</p>`;

				}

				return copy;

			}

		});

		html.push(`<div id="${tagMatch[1]}">${lines.join('\r\n')}</div>`);

	}

	return html.join('');

};

/**
 *
 */
Dekstop.use((req, res, next) => {

	console.log('middleware');

	req.testing = 'testing';

	return next();

});

/**
 *
 */
Dekstop.use('/', express.static('./src/static'));

/**
 *
 */
Dekstop.get('/api', (req, res, next) => {

	console.log('get route', req.testing);

	res.end();

});

/**
 *
 */
Dekstop.ws('/', (ws, req) => {

	const watcher = chokidar.watch('F:\\Desenvolvimento\\JAVASCRIPT\\dekstop\\source.np', {persistent: true});

	/**
	 *
	 */
	watcher.on('change', (filename, details) => {

		//ws.send(JSON.stringify(details));

		// Starting...
		fs.readFile('F:\\Desenvolvimento\\JAVASCRIPT\\dekstop\\source.np', {encoding: 'utf8', flag: 'r'}, (error, source) => {

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

		watcher.close();

	});

	/**
	 *
	 */
	ws.on('message', (message) => {

		ws.send('ECHO: ' + message);

	});

	// Starting...
	fs.readFile('F:\\Desenvolvimento\\JAVASCRIPT\\dekstop\\source.np', {encoding: 'utf8', flag: 'r'}, (error, source) => {

		let output = parser(source.toString());

		if (error) {

			output = error.message;

		}

		ws.send(output);

	});

	console.log('socket', req.testing);

});

module.exports = Dekstop;
