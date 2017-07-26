/**
 *
 */
const Service = require('node-windows').Service;
const EventLogger = require('node-windows').EventLogger;
const Logger = new EventLogger('Dekstop');
const Path = require('path');

const svc = new Service({
	name: 'Dekstop Service',
	description: 'The Dekstop Service (https://github.com/lord22shark/dekstop)',
	script: Path.join(__dirname,'../index.js'),
	workingdirectory: Path.join(__dirname,'../'),
	env: [
		{
			name: 'DEKSTOP_PATH',
			value: (process.argv[3] || '../../data').trim()
		},
		{
			name: 'DEKSTOP_PORT',
			value: parseInt(process.argv[4] || 4000) 
		},
	]
});

// Workaround...
svc.workingdirectory = Path.join(__dirname,'../');

// Listeners...
svc.on('install', () => {

	Logger.info('Dekstop service has been installed!');

	console.log('Installed!');

});

svc.on('uninstall', () => {

	Logger.info('Dekstop service has been uninstalled!');

	console.log('Uninstalled!');

});

// Start...
const command = process.argv[2];

switch (command) {

	case 'install':
	case 'uninstall':

		svc[command]();

	break;

	default:

		console.log('You need to provide: node create-windows-service.js (install|uninstall) /path/to/data PORT');

	break;

}
