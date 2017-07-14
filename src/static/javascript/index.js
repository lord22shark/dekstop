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

	};

}, 3000);