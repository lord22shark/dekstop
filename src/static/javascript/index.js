window.onclose = function () {

	if (window.sockets.raw) {

		window.sockets.raw.close();

	}

	if (window.sockets.rendered) {

		window.sockets.rendered.close();

	}

}

setTimeout(function () {

	// TODO: clipboard by TAG and click to activate
	// TODO Ctrl + Shift + D
	// TODO: accept hour:minutes
	var isViewOnly = window.location.hash.indexOf('view') !== -1;

	window.sockets = {
		raw: (isViewOnly === true) ? null : new WebSocket('ws://' + window.location.host + '/raw'),
		rendered: new WebSocket('ws://' + window.location.host + '/rendered')
	};

	window.editor = (isViewOnly === true) ? null : document.getElementById('editor');

	window.spaces = 0;

	window.schedules = [];

	window.shownSchedules = [];

	window.schedulesInterval = null;

	window.currentSection = null;

	window.tagTitleOptions = document.getElementById('tagTitleOptions'); // TODO onchange

	window.audioNotification = document.getElementById('audioNotification');

	window.clipboardShortcuts = {
		'96': 0,
		'97': 1,
		'98': 2,
		'99': 3,
		'100': 4,
		'101': 5,
		'102': 6,
		'103': 7,
		'104': 8,
		'105': 9,
		'48': 0,
		'49': 1,
		'50': 2,
		'51': 3,
		'52': 4,
		'53': 5,
		'54': 6,
		'55': 7,
		'56': 8,
		'57': 9
	};

	/**
	 *
	 */
	window.sockets.rendered.onmessage = function (event) {

		toastr.clear();

		var data = JSON.parse(event.data);

		document.getElementById('rendered').innerHTML = data.html;

		document.querySelectorAll('pre code').forEach(function (block) {

			hljs.highlightBlock(block)

		});

		document.querySelectorAll('div.tag-title').forEach(function (element) {

			var option = document.createElement('option');

			option.innerHTML = element.innerHTML;

			option.element = element;

			window.tagTitleOptions.appendChild(option);

		});

		if (window.currentSection) {

			window.sectionToggler();

		}

		window.schedules = data.schedules;

		window.clipboard = data.clipboard;

	};

	/**
	 *
	 */
	document.body.onkeydown = function (event) {

		var key = event.which;

		if ((event.ctrlKey === true) && (event.shiftKey === true) && (key.toString() in window.clipboardShortcuts)) {

			var clipboard = window.clipboard[window.clipboardShortcuts[key.toString()]];

			if (clipboard) {

				var textArea = document.createElement("textarea");

				try {

					// ---

					textArea.style.position = 'fixed';
					textArea.style.top = -10;
					textArea.style.left = -10;
					textArea.style.width = '2em';
					textArea.style.height = '2em';
					textArea.style.padding = 0;
					textArea.style.border = 'none';
					textArea.style.outline = 'none';
					textArea.style.boxShadow = 'none';
					textArea.style.background = 'transparent';
					textArea.value = clipboard.data;

					document.body.appendChild(textArea);

					textArea.select();

					// ---

					document.execCommand('copy');

					toastr.success(clipboard.data, clipboard.tag);

				} catch (e) {

					toastr.error(clipboard.data, clipboard.tag);

				}

				document.body.removeChild(textArea);

			} else {

				toastr.warning('No item for ' + window.clipboardShortcuts[key.toString()] + ' clipboard index.');

			}

		} else if (event.ctrlKey === true && key === 112) {

			window.tagTitleOptions.focus();

		}

	}

	/**
	 *
	 */
	window.schedulesHandler = function () {

		if ((window.schedules) && (window.schedules.length > 0)) {

			var now = new Date();

			now.setMilliseconds(0);

			now = now.getTime();

			window.schedules.forEach(function (schedule) {

				if (window.shownSchedules.indexOf(schedule.id) === -1) {

					var me = new Date(schedule.iso).getTime();

					var before = me - 300000;

					var after = me + 300000;

					if ((now >= before) && (now <= after)) {

						toastr.warning(schedule.text, schedule.iso, {closeButton: true, timeOut: 0, extendedTimeOut: 0});

						if (window.audioNotification.paused === true || window.audioNotification.currentTime === 0) {

							window.audioNotification.play();

						}

						window.shownSchedules.push(schedule.id);

					}

				}

			}); 


		}

	};

	if (isViewOnly === false) {

		/**
		 *
		 */
		window.sockets.raw.onmessage = function (event) {

			window.editor.value = event.data;

			// Should I remove this listener?

		}

		/**
		 *
		 */
		window.editor.onclick = function (event) {

			window.sectionDetector.bind(this)();

			window.sectionToggler();

		};

		/**
		 *
		 */
		window.editor.onkeydown = function (event) {

			var key = event.which;

			if (event.keyCode === 9) {

				event.preventDefault();

				var start = this.selectionStart;

				var end = this.selectionEnd;

				var target = event.target;

				var value = target.value;

				target.value = value.substring(0, start) + '\t' + value.substring(end);

				this.selectionStart = this.selectionEnd = start + 1;

			} else if ((key === 83) && (event.ctrlKey === true)) {

				event.preventDefault();

				window.sockets.raw.send(JSON.stringify({
					value: window.editor.value,
					commit: true
				}));

				window.sectionDetector.bind(this)();

			} else if ((key === 13) || (key === 10)) {

				window.sockets.raw.send(JSON.stringify({
					value: window.editor.value,
					commit: false
				}));

				window.sectionDetector.bind(this)();

				window.spaces = 0;

			} else if (key === 32) {

				window.spaces += 1;

				if (window.spaces === 3) {

					window.sockets.raw.send(JSON.stringify({
						value: window.editor.value,
						commit: false
					}));

					window.sectionDetector.bind(this)();

					window.spaces = 0;

				}

			}

		};

		/**
		 *
		 */
		window.sectionToggler = function () {

			var active = document.querySelector('div.tag-container.active');

			if (active) {

				active.className = 'tag-container';

			}

			if (window.currentSection) {

				var element = document.querySelector('div.tag-container[data-title=\'' + window.currentSection + '\']');

				if (element) {

					element.className += ' active';

				}

			}

		};

		/**
		 *
		 */
		window.sectionDetector = function () {

			var text = window.editor.value;

			var start = text.lastIndexOf('/@ [', this.selectionStart);

			if (start !== -1) {

				var end = text.indexOf(']', start) + 1;

				window.currentSection = text.substring(start, end).match(/\/\@\s\[(.*)\]/)[1];

			}

		};

	} else {

		document.getElementById('rawContainer').remove();

		document.getElementById('renderedContainer').style.maxWidth = '100%';

	}

	/**
	 *
	 */
	window.schedulesInterval = setInterval(window.schedulesHandler, 1000);

}, 2000);
