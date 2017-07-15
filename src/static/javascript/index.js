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

	window.schedulesHandler = null;

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
		window.schedules = data.schedules

	};

	/**
	 *
	 */
	window.editor.onkeypress = function (event) {

		// TODO Handle tab!
		// TODO Handle control + s

		var key = event.keyCode;

		if ((key === 13) || (key === 10)) {

			window.sockets.raw.send(window.editor.value);

			window.spaces = 0;

		} else if (key === 32) {

			window.spaces += 1;

			if (window.spaces === 3) {

				window.sockets.raw.send(window.editor.value);

				window.spaces = 0;

			}

		}

		return true;

	};

	/**
	 *
	 */
	window.schedulesHandler = setInterval(function () {

		window.schedules.forEach(function (item, index) {

			if (!item.alert) {

				window.alert(item.text + ' às ' + item.iso);

				//window.schedules[index].alert = true;

				item.alert = true;

			}

		});

	}, 2000);

}, 2000);