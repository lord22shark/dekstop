const md5 = require('md5');
const Entities = new require('html-entities').AllHtmlEntities;

/**
 *
 */
const parser = (source) => {

	const tagPattern = /\/\@\s{1}\[([A-Z0-9a-z\-\_ ]+)\]([^]*?)\[\@\\/gm;
	const hourPattern = /\/\@\s{1}\((\d{4}\-\d{2}\-\d{2}\s{1}\d{2}\:\d{2}\:\d{2})\)([^]*?)\(\@\\/gm;
	const codePattern = /\/\@\s{1}\{([A-Z0-9a-z\-\_\+\#]+)\}([^]*?)\{\@\\/gm;
	const clipboardPattern = /\/\@\s{1}\<CB\>([^]*?)\<\@\\/gm;
	const shortHourPattern = /\(\[\{H(A|B|N)(\d+)\}\]\)/;
	const shortCodePattern = /\<\(\[\{C(\d+)\}\]\)\>/;
	const urlPattern = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g;

	const tagMatches = [];

	const schedules = [];

	const clipboard = [];

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

			// After 5 minutes window
			} else if (now > after) {

				color = 'A';

			// Before 5 minutes window
			} else if (now < before) {

				color = 'B';

			}

			schedules.push({
				iso: hourMatch[1],
				text: hourMatch[2],
				timestamp: include,
				id: md5(`${hourMatch[1]}-${hourMatch[2]}`)
			});

			updated = updated.replace(hourMatch[0], `([{H${color}${hourIndex}}])`);

			hourIndex++;

		}

		// Codes
		let codeMatch;

		let codeMatches = [];

		let matchIndex = 0;

		while ((codeMatch = codePattern.exec(tagMatch[2])) != null) {

			codeMatches.push(codeMatch);

			updated = updated.replace(codeMatch[0], `<([{C${matchIndex}}])>`);

			matchIndex++;

		}

		// Clipboard
		let clipboardMatch;

		while ((clipboardMatch = clipboardPattern.exec(tagMatch[2])) != null) {

			clipboard.push({
				tag: tagMatch[1],
				data: clipboardMatch[1]
			});

			updated = updated.replace(clipboardMatch[0], clipboardMatch[1]);

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


				let shortCodeMatch = shortCodePattern.exec(copy);

				if (shortCodeMatch) {

					copy = `<pre><code class="${codeMatches[shortCodeMatch[1]][1]}">${Entities.encode(codeMatches[shortCodeMatch[1]][2].trim())}</code></pre>`;

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
		schedules: schedules,
		clipboard: clipboard
	});

};

module.exports = {parser};
