const cote = require('cote');
const chokidar = require('chokidar');
const fs = require("fs");
const Path = require('path');
const moment = require('moment');
const os = require("os");

const args = process.argv.slice(2)

if (args.length) {
	const client = new cote.Requester({
		name: 'Master'
	});

	const path = args[0];
	const watcher = chokidar.watch(path, {
		ignoreInitial: true,
	});
	try {
		watcher.on('add', (filePath) => {
			filePath = Path.resolve(filePath);
			console.log("file added => " + filePath + " .... waiting for 5 seconds!");
			setTimeout(() => {
				const file = fs.readFileSync(filePath);
				const filename = Path.basename(filePath);

				console.log("File '" + filename + "' size is " + ((file.byteLength) / 1000) + " KB");

				const request = {
					type: 'backup created',
					file,
					from: os.hostname()
				};

				client.send(request, (res) => {
					console.log("OK! from " + res);
				});
			}, 5000);

		});
	} catch (e) {
		console.log("Exception!");
		console.error(e);
	}
} else {
	const BackupReciever = new cote.Responder({
		name: 'Slave'
	});

	BackupReciever.on('backup created', (req, cb) => {
		console.log("Recieved new backup from " + req.from);
		const dir = `${Path.join(os.homedir(), 'Desktop', 'AlphaDental')}`;
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir);
		}
		const path = Path.join(dir, `AD_Backup_${req.from}_${moment().toISOString().replace(/:/g,'_')}.zip`);
		var buffer = Buffer.from(req.file.data);
		if (req.file.data.length === 0) {
			return;
		}
		fs.writeFileSync(path, buffer);
		cb(os.hostname());
	});
}