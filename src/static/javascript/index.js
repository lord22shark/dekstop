window.onclose = function () {

	if (window.ws) {

		window.ws.close();

	}

}

setTimeout(function () {

	console.log('Socket...');

	window.ws = new WebSocket('ws://localhost:4000/');

	window.ws.onmessage = function (event) {

		console.log(event);

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

}, 3000);