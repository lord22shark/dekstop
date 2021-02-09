/**
 * Express Dekstop Server
 */

/**
 * External Dependencies
 */
const Express = require('express');
const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const {exec} = require('child_process');
const Dekstop = Express();
const expressWs = require('express-ws')(Dekstop);
const Glob = require("glob")

/**
 * Internal Dependencies
 */
const {parser, globFiles, getFile} = require('./utils/index.js');

/**
 * Setup
 */
let Watcher = null;

const Clients = {};

/**
 * Sends:
 * Blocks Name Files: [String],
 * Last Modified File: {Title, Content}
 * Parsed Data: {html, scheduled, clipboard}
 */
const onBundleConnectData = (datapath) => {

	const output = {
		blocks: [],
		lastModified: {
			title: null,
			content: null,
			timestamp: null
		},
		parsed: null
	};

	return new Promise((resolve, reject) => {

		new Glob(path.join(datapath, '*.dkt'), (error, files) => {

			if (error) {

				reject(error);

			} else {

				const filesToPromise = files.map((file) => {

					output.blocks.push(path.basename(file).replace('.dkt', ''));

					return new Promise((resolveFile, rejectFile) => {

						fs.readFile(file, {encoding: 'utf8', flag: 'r'}, (errorRead, source) => {

							if (error) {

								rejectFile(error);

							} else {

								resolveFile({
									raw: source,
									mtime: fs.statSync(file).mtimeMs
								});

							}

						});

					});

				});

				Promise.all(filesToPromise).then((blocks) => {

					blocks.sort((blockA, blockB) => {

						if (blockA.mtime < blockB.mtime) {

							return 1;

						} else if (blockA.mtime > blockB.mtime) {

							return -1;

						} else {

							return 0;

						}

					});

					const tagPattern = /\/\@\s{1}\[([A-Z0-9a-z\-\_ ]+)\]([^]*?)\[\@\\/gm;

					const matches = tagPattern.exec(blocks[0].raw);

					output.lastModified.title = matches[1];
					output.lastModified.content = matches[2].trim();
					output.lastModified.timestamp = blocks[0].mtime;

					output.parsed = parser(blocks.map((block) => {

						return block.raw;

					}).join('\n'), false);

					resolve(output);

				}).catch((allError) => {

					reject(allError);

				});

			}

		});

	});

};

/** 
 * Broadcast data
 */
const broadcast = (message) => {

	Object.values(Clients).forEach((websocket) => {

		websocket.send(JSON.stringify(message));

	});

};

/**
 *
 */
function onFetchParseAndSend () {

	globFiles(Dekstop.locals.fullpath).then((data) => {

		broadcast({
			message: 'onUpdateParsedData',
			data: {
				parsed: parser(data.source, false),
				timestamp: data.timestamp
			}
		});

	}).catch((error) => {

		console.log(error);

	});

}

/**
 *
 */
function onWatcherChangeHandler (filename, stats) {

	console.log('onWatcherChangeHandler', filename, (stats) ? stats.mtime : '...');

	onFetchParseAndSend();

};

/**
 *
 */
function onWatcherAddHandler (filename, stats) {

	console.log('onWatcherAddHandler', filename, (stats) ? stats.mtime : '...');

	// broadcast.send(GLOB ->PARSE && VIEW OR PARSE&&VIEW.then(join))

	onBundleConnectData(Dekstop.locals.fullpath).then((output) => {

		this.websocket.send(JSON.stringify({
			message: 'onBundleConnectData',
			data: output
		}));

	}).catch((error) => {

		console.log('onWatcherAddHandler => onBundleConnectData', error);

	});

};

/**
 *
 */
function onWatcherUnlinkHandler (filename) {

	console.log('onWatcherUnlinkHandler', filename);

	onBundleConnectData(Dekstop.locals.fullpath).then((output) => {

		this.websocket.send(JSON.stringify({
			message: 'onBundleConnectData',
			data: output
		}));

	}).catch((error) => {

		console.log('onWatcherAddHandler => onBundleConnectData', error);

	});

};

/** 
 *
 */
function onMessage (message) {

	const websocket = this;

	try {

		const parsedMessage = JSON.parse(message);

		if ((parsedMessage.message) && (parsedMessage.data !== null && parsedMessage.data !== undefined)) {

			const data = parsedMessage.data;

			switch (parsedMessage.message) {

				case 'onSave':

					const content = `/@ [${data.block}]\n${data.text}\n[@\\`;

					fs.writeFile(path.join(Dekstop.locals.fullpath, data.block + '.dkt'), content, (error) => {

						if (error) {

							console.error(error);

							return;

						}

						if (data.commit === true) {

							let command = `cd "${Dekstop.locals.fullpath}" && git add -u * && git commit -m "Automatic update."`;

							exec(command, (giterror, stdout, stderror) => {

								if (giterror) {

									console.error(`GIT EXECUTION ERROR: ${giterror}`);
									console.error(`STDOUT: ${stdout}`);
									console.error(`STDERROR: ${stderror}`);
									console.log('----');

								}

							});

						}

					});

				break;

				case 'onUpdate':

					onBundleConnectData(Dekstop.locals.fullpath).then((output) => {

						websocket.send(JSON.stringify({
							message: 'onBundleConnectData',
							data: output
						}));

					}).catch((error) => {

						console.log('onUpdate => onBundleConnectData', error);

					});

				break;

				case 'onGetBlock':

					getFile(path.join(Dekstop.locals.path, data + '.dkt')).then((fileBlock) => {

						websocket.send(JSON.stringify({
							message: 'onGetBlock',
							data: fileBlock
						}));

					}).catch((getFileError) => {

						console.log(getFileError);

					});

				break;

				case 'onAdd':

					const blockContent = `/@ [${data}]\nA new Dekstop block...\n[@\\`;

					const filename = path.join(Dekstop.locals.fullpath, data + '.dkt');

					fs.writeFile(filename, blockContent, (error) => {

						if (error) {

							console.error(error);

							return;

						}

						let command = `cd "${Dekstop.locals.fullpath}" && git add "${filename}" && git commit -m "Created block."`;

						exec(command, (giterror, stdout, stderror) => {

							if (giterror) {

								console.error(`GIT EXECUTION ERROR: ${giterror}`);
								console.error(`STDOUT: ${stdout}`);
								console.error(`STDERROR: ${stderror}`);
								console.log('----');

							}

						});

					}); 

				break;

				case 'onDelete':

					const deleteFilename = path.join(Dekstop.locals.fullpath, data + '.dkt');

					fs.unlink(deleteFilename, (error) => {

						if (error) {

							console.error(error);

							return;

						}

						let command = `cd "${Dekstop.locals.fullpath}" && git rm "${deleteFilename}" && git commit -m "Deleted block."`;

						exec(command, (giterror, stdout, stderror) => {

							if (giterror) {

								console.error(`GIT EXECUTION ERROR: ${giterror}`);
								console.error(`STDOUT: ${stdout}`);
								console.error(`STDERROR: ${stderror}`);
								console.log('----');

							}

						});

					}); 

				break;

				case 'onAddCodeBlock':

					const contentWithBlock = `/@ [${data.block}]\n${data.text}\n[@\\`;

					fs.writeFile(path.join(Dekstop.locals.fullpath, data.block + '.dkt'), contentWithBlock, (error) => {

						if (error) {

							console.error(error);

							return;

						}

						let command = `cd "${Dekstop.locals.fullpath}" && git add -u * && git commit -m "Code Block Added."`;

						exec(command, (giterror, stdout, stderror) => {

							if (giterror) {

								console.error(`GIT EXECUTION ERROR: ${giterror}`);
								console.error(`STDOUT: ${stdout}`);
								console.error(`STDERROR: ${stderror}`);
								console.log('----');

							}

						});
						
					});

				break;

				case 'onAddScheduleBlock':

					const scheduleWithBlock = `/@ [${data.block}]\n${data.text}\n[@\\`;

					fs.writeFile(path.join(Dekstop.locals.fullpath, data.block + '.dkt'), scheduleWithBlock, (error) => {

						if (error) {

							console.error(error);

							return;

						}

						let command = `cd "${Dekstop.locals.fullpath}" && git add -u * && git commit -m "Schedule Block Added."`;

						exec(command, (giterror, stdout, stderror) => {

							if (giterror) {

								console.error(`GIT EXECUTION ERROR: ${giterror}`);
								console.error(`STDOUT: ${stdout}`);
								console.error(`STDERROR: ${stderror}`);
								console.log('----');

							}

						});
						
					});

				break;

				case 'onAddClipboardBlock':

					const clipboardWithBlock = `/@ [${data.block}]\n${data.text}\n[@\\`;

					fs.writeFile(path.join(Dekstop.locals.fullpath, data.block + '.dkt'), clipboardWithBlock, (error) => {

						if (error) {

							console.error(error);

							return;

						}

						let command = `cd "${Dekstop.locals.fullpath}" && git add -u * && git commit -m "Clipboard Block Added."`;

						exec(command, (giterror, stdout, stderror) => {

							if (giterror) {

								console.error(`GIT EXECUTION ERROR: ${giterror}`);
								console.error(`STDOUT: ${stdout}`);
								console.error(`STDERROR: ${stderror}`);
								console.log('----');

							}

						});
						
					});

				break;				

			}

		} else {

			console.log('Wrong type');

		}

	} catch (e) {

		console.log(e);

	}

};

/** 
 *
 */
function onClose () {

	console.log(`[DISCONNECTED] Client: ${this.$dekstop}`);

	if (Watcher !== null) {

		Watcher.close();

		Watcher = null;

	}

	delete Clients[this.$dekstop];

};

/**
 * Handling Errors
 */
Dekstop.use((error, request, response, next) => {

	// TODO
	console.log('[ERROR]', error.toString(), new Date().toISOString());

});


/**
 * Main Route
 */
Dekstop.get('/', (request, response) => {

	response.status(200).set('Content-type', 'text/html').sendFile('static/html/index.html', {
		root: path.join(__dirname, './')
	});

});

/**
 *
 */
Dekstop.ws('/connect', (websocket, request) => {

	const _id = Math.random().toString(16).split('.')[1].toUpperCase();

	websocket.$dekstop = _id;

	Clients[_id] = websocket;

	Watcher = chokidar.watch(path.join(request.app.locals.fullpath, '*.dkt'), {
		persistent: true,
		ignored: /\.git/
	});

	Watcher.on('change', onWatcherChangeHandler.bind({watcher: Watcher, websocket: websocket}));
	Watcher.on('unlink', onWatcherUnlinkHandler.bind({watcher: Watcher, websocket: websocket}));

	websocket.on('message', onMessage);

	websocket.on('close', onClose.bind(websocket));

	// To avoid process existing files on connect
	setTimeout(() => {

		Watcher.on('add', onWatcherAddHandler.bind({watcher: Watcher, websocket: websocket}));

	}, 999);

	onBundleConnectData(request.app.locals.path).then((output) => {

		websocket.send(JSON.stringify({
			message: 'onBundleConnectData',
			data: output
		}));

	}).catch((error) => {

		console.log(error);

	});

	console.log(`[CONNECTED] New client: ${_id}`, new Date().toISOString());

});

/**
 * Static Resources
 */
Dekstop.use('/audio', Express.static(path.join(__dirname, 'static', 'audio')));
Dekstop.use('/css', Express.static(path.join(__dirname, 'static', 'css')));
Dekstop.use('/fonts', Express.static(path.join(__dirname, 'static', 'fonts')));
Dekstop.use('/images', Express.static(path.join(__dirname, 'static', 'images')));
Dekstop.use('/javascript', Express.static(path.join(__dirname, 'static', 'javascript')));

/**
 * Static Javascript Libraries
 */
Dekstop.use('/lib/highlightjs', Express.static(path.join(__dirname, '..', 'node_modules', 'highlightjs')));
Dekstop.use('/lib/toastr', Express.static(path.join(__dirname, '..', 'node_modules', 'toastr', 'build')));
Dekstop.use('/lib/jquery', Express.static(path.join(__dirname, '..', 'node_modules', 'jquery', 'dist')));
Dekstop.use('/lib/vue', Express.static(path.join(__dirname, '..', 'node_modules', 'vue', 'dist')));
Dekstop.use('/lib/moment', Express.static(path.join(__dirname, '..', 'node_modules', 'moment', 'min')));

module.exports = Dekstop;
