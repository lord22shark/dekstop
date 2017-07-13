/**
 *
 */

const Dekstop = require('./src/index.js');

try {

	// Watcher file -- if !exists, create, commit
	Dekstop.listen(4000);

	console.log('Listening...');

} catch (error) {

	console.log(error);

}
