const chokidar = require('chokidar');
const fs = require("fs");
const Path = require('path');
const rimraf = require('rimraf');
const moment = require('moment');
const args = process.argv.slice(2)
const lineReader = require('line-reader');
const destinations_file = Path.resolve("destinations.input");
const config = require("./backup.config");
let destination_folder_path = "";


const backup_folder_path = config.backup_folder;

const watcher = chokidar.watch(backup_folder_path, {
	ignoreInitial: true,
});

try {
	watcher.on('add', (filePath) => {
		filePath = Path.resolve(filePath);
		console.log("file added => " + filePath + " .... waiting for 5 seconds!");
		setTimeout(() => {
			const filename = Path.basename(filePath);

			config.destination_folders.forEach(folder => {
				console.log("Trying to copy the file into " + folder);
				destination_folder_path = folder;
				try {
					fs.copyFileSync(filePath, Path.join(destination_folder_path, filename));
					console.log(`File ${filename} has copied to ${destination_folder_path} successfully!`);
					deleteOldFiles(destination_folder_path, filename);
				} catch (e) {
					console.log("Exception while copying file to " + destination_folder_path);
				}
			})

			deleteOldFiles(backup_folder_path, filename);

		}, 5000);
	});
} catch (e) {
	console.log("Exception!");
	console.error(e);
}


function deleteOldFiles(path, filename) {
	const files = fs.readdirSync(path);

	if (files.length < 5) {
		return;
	}

	files.forEach(function (file) {
		const stat = fs.statSync(Path.join(path, file));
		const destfilename = Path.basename(file);

		if (moment(stat.mtime).add(parseInt(config.delete_file_old_than), 'days').isBefore(moment()) && destfilename !== filename) {
			return rimraf(Path.join(path, file), function (err) {
				if (err) {
					return console.error(err);
				}
				console.log('====> ' + destfilename + ' successfully deleted');
			});
		}
	});
}