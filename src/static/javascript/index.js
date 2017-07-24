window.onclose = function () {

	if (window.ws) {

		window.ws.close();

	}

}

setTimeout(function () {

	window.sockets = {
		raw: new WebSocket('ws://localhost:4000/raw'),
		rendered: new WebSocket('ws://localhost:4000/rendered')
	};

	window.editor = document.getElementById('editor');

	window.spaces = 0;

	window.schedules = [];

	window.schedulesInterval = null;

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

		/*document.querySelectorAll('div.tag-title').forEach(function (element) {

			element.onclick = function (event) {

				var content = document.getElementById(event.target.id.replace('-toggler', '-content'));

				console.log(content);

				if ((content.style.display === 'block') || (content.style.display === '')) {

					content.style.display = 'none';

				} else  {

					content.style.display = 'block';

				}

			};

		});*/

		// Schedules

		//clearInterval(window.schedulesInterval);

		/*data.schedules.forEach(function (newSchedule) {

			if (window.schedules.length === 0) {

				window.schedules.push(newSchedule);

			} else {

				window.schedules.forEach(function (oldSchedule) {

					if (oldSchedule.id !== newSchedule.id) {

						window.schedules.push(newSchedule);

					}

				});

			}

		});*/

		//window.schedulesInterval = setInterval(window.schedulesHandler, 1000);

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

		} else if ((key === 13) || (key === 10)) {

			window.sockets.raw.send(window.editor.value);

			window.spaces = 0;

		} else if (key === 32) {

			window.spaces += 1;

			if (window.spaces === 3) {

				window.sockets.raw.send(window.editor.value);

				window.spaces = 0;

			}

		}

	};

	/**
	 *
	 */
	window.schedulesHandler = function () {

		var now = new Date().getTime();

		window.schedules.forEach(function (item, index, source) {

			var timestamp = new Date(item.iso).getTime();

			// if past, delete

			if (timestamp === now) {

				console.log('AGORA', item);

			} else if (!item.alert) {

				console.log(item);

				source[index].alert = true;

			}

		});

		console.log(window.schedules);

	};

	/**
	 *
	 */
	//window.schedulesInterval = setInterval(window.schedulesHandler, 1000);

}, 2000);