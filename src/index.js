/**
 *
 */

const express = require('express');
const Dekstop = express();
const expressWs = require('express-ws')(Dekstop);
const fs = require('fs');
const chokidar = require('chokidar');
const md5 = require('md5');
const {exec} = require('child_process');

/**
 *
 */
const parser = (source) => {

	const tagPattern = /\/\@\s{1}\[([A-Z0-9a-z\-\_ ]+)\]([^]*?)\[\@\\/gm;
	const hourPattern = /\/\@\s{1}\((\d{4}\-\d{2}\-\d{2}\s{1}\d{2}\:\d{2}\:\d{2})\)([^]*?)\(\@\\/gm;
	const codePattern = /\/\@\s{1}\{([A-Z0-9a-z\-\_\+\#]+)\}([^]*?)\{\@\\/gm;
	const shortHourPattern = /\(\[\{H(A|B|N)(\d+)\}\]\)/g;
	const shortCodePattern = /\(\[\{C(\d+)\}\]\)/g;
	const urlPattern = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g;

	const tagMatches = [];

	const schedules = [];

	let html = [];

	// ---
	let tagMatch;

	const now = new Date().getTime();

	while ((tagMatch = tagPattern.exec(source)) != null) {

		let updated = tagMatch[2];

		tagMatches.push(tagMatch);

		let hourMatch;

		let hourMatches = [];

		let hourIndex = 0;

		while ((hourMatch = hourPattern.exec(tagMatch[2])) != null) {

			hourMatches.push(hourMatch);

			let include = new Date(hourMatch[1]).getTime();

			let color;

			let before = include - 300000;

			let after = include + 300000;

			// 5 minutes window
			if ((now >= before) && (now <= after)) {

				color = 'N';

				schedules.push({
					iso: hourMatch[1],
					text: hourMatch[2],
					timestamp: include,
					id: md5(`${hourMatch[1]}-${hourMatch[2]}`) 
				});

			// After 5 minutes window
			} else if (now > after) {

				color = 'A';

			// Before 5 minutes window
			} else if (now < before) {

				color = 'B';

			}

			updated = updated.replace(hourMatch[0], `([{H${color}${hourIndex}}])`);

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

				const urls = copy.match(urlPattern);

				if ((urls) && (urls.length > 0)) {

					urls.forEach(function (url) {

						copy = copy.replace(url, `<a target="_blank" href="${url}">${url}</a>`);

					});

				}

				let shortHourMatch;

				while ((shortHourMatch = shortHourPattern.exec(copy)) != null) {

					let index = parseInt(shortHourMatch[2]);

					let color = shortHourMatch[1];

					let style = `schedule-time-${color}`;

					copy = copy.replace(`([{H${color}${index}}])`, `<b class="${style}" title="${hourMatches[index][1]}"><img class="schedule-bell" src="images/bell.png" /><span>${hourMatches[index][2].trim()}</span></b>`);

				}

				if (shortCodePattern.test(copy)) {

					let index = parseInt(copy.replace(/\D+/g, ''));

					copy = `<pre><code class="${codeMatches[index][1]}">${codeMatches[index][2].trim()}</code></pre>`;

				} else if (line[0] === '\t') {

					let count = ((line.match(/\t/g) || []).length) * 22;

					copy = `<p style="text-indent: ${count}px">${copy}</p>`;

				} else {

					copy = `<p>${copy}</p>`;

				}

				return copy;

			}

		});

		html.push(`
			<div class="tag-container" data-title="${tagMatch[1]}">
				<div id="${tagMatch[1]}-toggler" class="tag-title">${tagMatch[1]}</div>
				<div id="${tagMatch[1]}-content" class="tag-content">
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
 * Middleware purposes

Dekstop.use((request, res, next) => {

	return next();

});
 */

/**
 *
 */
Dekstop.use('/', express.static('./src/static'));
Dekstop.use('/highlightjs', express.static('./node_modules/highlightjs'));

/**
 *
 */
Dekstop.ws('/raw', (ws, request) => {

	/**
	 *
	 */
	ws.on('message', (message) => {

		fs.writeFile(request.app.locals.filename, message, (error) => {

			if (error) {

				return console.log(error);

			}

			exec(`cd ${request.app.locals.path} && git add source.np && git commit -m "Automatic update."`, (giterror) => {

				if (giterror) {

					console.error(`GIT EXECUTION ERROR: ${giterror}`);

				}

			});

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
