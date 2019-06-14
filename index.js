const Discover = require('node-discover');
const chokidar = require('chokidar');
const fs = require("fs");
const bodyParser = require("body-parser");
const express = require("express");
const app = express();
const axios = require("axios");
const http = require('http');
const cors = require('cors');
const Path = require('path');

app.use(cors());
app.use(bodyParser.json());

const discover = Discover({}, (e) => {
	if (e) {
		console.log(e);
		return;
	}
	discover.promote();
});

const args = process.argv.slice(2)

if (args.length) {
	const path = args[0];
	const watcher = chokidar.watch(path, {
		ignoreInitial: true,
	});
	watcher.on('add', (filePath) => {
		const file = fs.readFileSync(filePath);
		const body = {
			file
		};

		const filename = Path.basename(filePath);

		discover.eachNode(node => {
			const url = `http://${node.address}:${node.advertisement}`;
			axios.post(url, body)
				.then(() => console.log(`Sending ${filename} to ${url} successfully`))
				.catch(err => console.error(err.message));
		});
	});
}

app.post('/', function (req, res) {
	const dir = `${Path.join(require('os').homedir(), 'Desktop', 'AlphaDental')}`;
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir);
	}
	const path = Path.join(dir, 'backup.zip');
	var buffer = Buffer.from(req.body.file.data);
	if (req.body.file.data.length === 0) {
		return res.json({
			msg: "ok"
		});
	}
	fs.writeFileSync(path, buffer);

	res.json({
		msg: "ok"
	});
});

let server = http.createServer(app);
server.listen(0, () => {
	discover.advertise(server.address().port);
	console.log("Express.js start listening on: " + server.address().port)
});