var 	fs = require("fs"),
	path = require("path"),
	unixlib = require("unixlib");

this.authenticate = function(mboxPath, username, password, cb) {

	var self = this;

	unixlib.pamauth("system-auth", username, password, function(result) {

		if (result === false) {

			cb({errno: 1}, null);

		} else {

			var mboxfile = path.join(mboxPath, username);

			path.exists(mboxfile, function(exists) {

				if (exists === true) {

					fs.open(mboxfile, "r+", function(err, fd) {

						unixlib.flock(fd, function(result) {

							if (result === true)
								cb(null, fd);

							else
								cb({errno: 2}, null);

						});
					});

				} else 
					cb({errno: 3});

			});
		}
	});

}

this.unlock= function(cb) {

	unixlib.deflock(fd, function(result) {

		if (result === true) 
			cb();

		else
			cb({errno: 4});
	});

}

this.mailbox = function(fd, cb) {

	// Not the best data structure, but its good enough
	var messages = {
		offsets:  [],
		sizes: [],
		count: 0,
		size: 0
	}

	function readmbox(position, previousbuf, cb) {

		var i = 0;
		var minlen = 0;
		var msgsize = 0;
		var buffer = new Buffer(4096);

		fs.read(fd, buffer, 0, 4096, position, function(err, bytesRead, buffer) {

			if (err) {

				cb(err);

			} else {

				if (previousbuf !== null) {

					buffer = new Buffer(previousbuf + buffer)
					previousbuf = null;

				}

				i = 0;
				minlen = (bytesRead === buffer.length) ? buffer.length : bytesRead;
				while (i < minlen) {

					// Match for newline, ASCII code 10
					if (buffer[i] === 10) {

						// \nFrom is within buffer 
						if (i + 5 > buffer.length-1) {

							previousbuf = new Buffer(buffer.slice(i));
							break;

						// \nFrom is split between the buffers
						} else if (buffer.slice(i+1, i+6).toString() === "From ")
							messages.offsets.push(position+i+1)

					}

					i++;

				}

				// There is more to read!
				if (bytesRead === 4096) {

					readmbox(position+4096, previousbuf, cb);

				} else {

					i = 0;

					while (i < messages.offsets.length - 1) {

						msgsize = messages.offsets[i+1] - messages.offsets[i];
						messages.size += msgsize;
						messages.sizes.push(msgsize);
						i++;

					}

					msgsize = position + bytesRead - messages.offsets[i];
					messages.size += msgsize;
					messages.sizes[messages.offsets[i]] = msgsize;
					messages.count = messages.offsets.length;
					cb(null);

				}
			}
		});
	}

	this.list = function(cb) {
		cb(messages.sizes);
	}

	this.stat = function(cb) {
		cb(messages.count, messages.size);
	}

	this.dele = function(msgnumber, cb) {

		if (msgnumber > messages.count) {

			cb(true);

		} else {

			// Implement delete function
//			msglist[msgNumber].deleted = true;
			cb(null);

		}
	}

	this.retr = function(msgnumber, cb) {

		if (msgnumber > messages.count) {

			cb({errno: 5});

		} else {

			var bufsize = messages.sizes[messages.offsets[msgnumber-1]];
			var buffer = new Buffer(bufsize);

			fs.read(fd, buffer, 0, bufsize, messages.offsets[msgnumber-1], function(err, bytesRead, buffer) {
				cb(err, buffer.toString());
			});
		}
	}

	this.close=function(cb) {

		// This should automagically release the lock
		fs.close(fd, cb);

	}

	// new Buffer(\n): a small required hack for our readmbox() implementation
	readmbox(-1, new Buffer("\n"), function(err) {
		cb(err);
	});

}
