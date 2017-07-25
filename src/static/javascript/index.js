window.onclose = function () {

	if (window.sockets.raw) {

		window.sockets.raw.close();

	}

	if (window.sockets.rendered) {

		window.sockets.rendered.close();

	}

}

setTimeout(function () {

	window.sockets = {
		raw: new WebSocket('ws://' + window.location.host + '/raw'),
		rendered: new WebSocket('ws://' + window.location.host + '/rendered')
	};

	window.editor = document.getElementById('editor');

	window.spaces = 0;

	window.schedules = [];

	window.schedulesInterval = null;

	window.currentSection = null;

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
	window.sockets.rendered.onmessage = function (event) {

		var data = JSON.parse(event.data);

		document.getElementById('rendered').innerHTML = data.html;

		document.querySelectorAll('pre code').forEach(function (block) {

			hljs.highlightBlock(block)

		});

		if (window.currentSection) {

			window.sectionToggler();

		}

		window.schedules = data.schedules;

	};

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

			window.sockets.raw.send(window.editor.value);

			window.sectionDetector.bind(this)();

		} else if ((key === 13) || (key === 10)) {

			window.sockets.raw.send(window.editor.value);

			window.sectionDetector.bind(this)();

			window.spaces = 0;

		} else if (key === 32) {

			window.spaces += 1;

			if (window.spaces === 3) {

				window.sockets.raw.send(window.editor.value);

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

			document.querySelector('div.tag-container[data-title=\'' + window.currentSection + '\']').className += ' active';

		}

	};

	/**
	 *
	 */
	window.sectionDetector = function () {

		var text = window.editor.value;

		var start = text.lastIndexOf('/@ [', this.selectionStart);

		var end = text.indexOf(']', start) + 1;

		window.currentSection = text.substring(start, end).match(/\/\@\s\[(.*)\]/)[1];

	};

	/**
	 *
	 */
	window.schedulesHandler = function () {

		if ((window.schedules) && (window.schedules.length > 0)) {

			var now = new Date();

			now.setMilliseconds(0);

			now = now.getTime();

			window.schedules.forEach(function (schedule) {

				if (schedule.timestamp === now) {

					window.alert(schedule.text);

				}

			}); 


		}

	};

	/**
	 *
	 */
	window.schedulesInterval = setInterval(window.schedulesHandler, 1000);

}, 2000);