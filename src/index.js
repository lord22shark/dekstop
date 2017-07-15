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

	const schedules = [];

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

			schedules.push({
				iso: hourMatch[1],
				text: hourMatch[2]
			});

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

					copy = copy.replace(`([{H${index}}])`, `<b data-when="${hourMatches[index][1]}"><img class="schedule-bell" src="images/bell.png" /><span>${hourMatches[index][2]}</span></b>`);

				}

				if (shortCodePattern.test(copy)) {

					let index = parseInt(copy.replace(/\D+/g, ''));

					copy = `<pre><code class="${codeMatches[index][1]}">${codeMatches[index][2].trim()}</code></pre>`;

				} else if (line[0] === '\t') {

					copy = `<p>${copy}</p>`;

				} else {

					copy = `<p>${copy}</p>`;

				}

				return copy;

			}

		});

		html.push(`
			<div class="tag-container">
				<div id="${tagMatch[1]}-toggler" class="tag-title">${tagMatch[1]}</div>
				<div id="${tagMatch[1]}-content">
					${lines.join('\r\n')}
				</div>
			</div>
		`);

	}

	return JSON.stringify({
		html: html.join(''),
		schedules: schedules
	});

};

/**
 *
 */
Dekstop.use((req, res, next) => {

	console.log('Middleware...');

	//req.testing = 'testing';

	return next();

});

/**
 *
 */
Dekstop.use('/', express.static('./src/static'));
Dekstop.use('/highlightjs', express.static('./node_modules/highlightjs'));

/**
 *
 */
Dekstop.ws('/raw', (ws, req) => {

	/**
	 *
	 */
	ws.on('message', (message) => {

		fs.writeFile('F:\\Desenvolvimento\\JAVASCRIPT\\dekstop\\source.np', message, (error) => {

			if (error) {

				return console.log(error);

			}

			// git add source.np
			// git commit -m "Atualização de Date"
			console.log('GIT');

		}); 

	});

	// Starting...
	fs.readFile('F:\\Desenvolvimento\\JAVASCRIPT\\dekstop\\source.np', {encoding: 'utf8', flag: 'r'}, (error, source) => {

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
Dekstop.ws('/rendered', (ws, req) => {

	const readerWatcher = chokidar.watch('F:\\Desenvolvimento\\JAVASCRIPT\\dekstop\\source.np', {persistent: true});

	/**
	 *
	 */
	readerWatcher.on('change', (filename, details) => {

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

		console.log('Fechooou');

		readerWatcher.close();

	});


	// Starting...
	fs.readFile('F:\\Desenvolvimento\\JAVASCRIPT\\dekstop\\source.np', {encoding: 'utf8', flag: 'r'}, (error, source) => {

		let output = parser(source.toString());

		if (error) {

			output = error.message;

		}

		ws.send(output);

	});

});

module.exports = Dekstop;
