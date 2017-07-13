/**
 *
 */

const express = require('express');
const Dekstop = express();
const expressWs = require('express-ws')(Dekstop);

/**
 *
 */
Dekstop.use((req, res, next) => {

	console.log('middleware');

	req.testing = 'testing';

	return next();

});

/**
 *
 */
Dekstop.use('/', express.static('./src/static'));

/**
 *
 */
Dekstop.get('/api', (req, res, next) => {

	console.log('get route', req.testing);

	res.end();

});

/**
 *
 */
Dekstop.ws('/', (ws, req) => {

	ws.on('message', (message) => {

		console.log(message);

	});

	console.log('socket', req.testing);

});

module.exports = Dekstop;
