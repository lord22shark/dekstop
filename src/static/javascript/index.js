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

		document.getElementById('rendered').innerHTML = event.data;

		document.querySelectorAll('pre code').forEach(function (block) {

			hljs.highlightBlock(block)

		});

		document.querySelectorAll('div.tag-title').forEach(function (element) {

			element.onclick = function (event) {

				var content = document.getElementById(event.target.id.replace('-toggler', '-content'));

				console.log(content);

				if ((content.style.display === 'block') || (content.style.display === '')) {

					content.style.display = 'none';

				} else  {

					content.style.display = 'block';

				}

			};

		});

	};

	/**
	 *
	 */
	window.editor.onkeypress = function (event) {

		// TODO Handle tab!

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

	/*setInterval(function () {

		window.sockets.raw.send(window.editor.value);

		console.log('Sent...');

	}, 5000);*/

}, 2000);