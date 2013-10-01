// still-pusher
// https://github.com/thenut77/stillshots
// (C) 2013 Jason Dudash, All Rights Reserved
// Licensed as GNU GPLv2
var fs = require('fs'),
    util = require('util'),
    path = require('path'),
    gm = require('gm'),
    request = require('request'),
    bunyan = require('bunyan');

var optimist = require('optimist')
    .usage('Usage: $0')
    .alias('h', 'help')
    .
default ('w', '.')
    .demand('w')
    .alias('w', 'watchdir')
    .describe('w', 'Directory to watch for stills')
    .
default ('r', 'http://127.0.0.1')
    .alias('r', 'remotehost')
    .describe('r', 'Remote host to push thumbnails to')
    .
default ('p', '8080')
    .alias('p', 'remoteport')
    .describe('p', 'Remote port to push thumbnails to')
    .
default ('d', '500')
    .alias('d', 'timedelay')
    .describe('d', 'Time to delay push of data after notification is received')
    .alias('o', 'pushoriginal')
    .describe('o', 'Push the original file up to the server also');
var argv = optimist.argv;
if (argv.help) {
    optimist.showHelp();
    process.exit(0);
}

var log = bunyan.createLogger({
    name: 'still-pusher-logger',
    level: process.env.LOG_LEVEL || 'info',
    stream: process.stdout,
    serializers: bunyan.stdSerializers
});

var serverUploadURL = argv.remotehost + ':' + argv.remoteport + '/uploads/thumbs/';
var serverUploadOriginalURL = argv.remotehost + ':' + argv.remoteport + '/uploads/originals/';
log.debug('still-pusher pushing thumbs to server\'' + serverUploadURL + '\'');
if (argv.pushoriginal) {
    log.debug('still-pusher pushing originals to server\'' + serverUploadOriginalURL + '\'');
}
// verify that the directory exists - do this synchronously because it needs to happen now
var exists = fs.existsSync(argv.watchdir);
if (!exists) {
    log.fatal('Error: Could not access directory \'' + argv.watchdir + '\'');
    process.exit(1);
}

log.debug('still-pusher building thumbs under directory \'' + argv.watchdir + '\'');
try {
    fs.mkdirSync(argv.watchdir + '/thumbs');
} catch (e) {
    if (e.code != 'EEXIST') {
        throw e;
    }
}
log.debug('still-pusher watching on directory \'' + argv.watchdir + '\'');

// kick off a watch loop to see change events
fs.watch(argv.watchdir, function(event, filename) {
    if (event != 'rename') return; // adding files registers as rename
    if (filename) {
        log.trace('filename provided is: ' + filename);
        //  check to make sure this is an image notification
        var exttype = path.extname(filename).toLowerCase();
        if (exttype != '.jpg' &&
            exttype != '.bmp' &&
            exttype != '.gif' &&
            exttype != '.png') {
            log.trace('file change is not for an image file ' + argv.watchdir + '/' + filename);
            return;
        }
        // check to make sure the image is still there
        var exists = fs.existsSync(argv.watchdir + '/' + filename);
        if (!exists) {
            log.trace('file change is not a file addition ' + argv.watchdir + '/' + filename);
            return;
        }

        setTimeout(function() {
            // build thumbnail as 150x150 and strip metadata
            var thumbnailFile = argv.watchdir + '/thumbs/thumb_' + filename;
            var originalFile = argv.watchdir + '/' + filename;
            gm(originalFile)
                .noProfile()
                .resize(150, 150)
                .write(thumbnailFile, function(err) {
                    if (err) {
                        log.error('ERROR: gm failed to create thumbnail ' + thumbnailFile + '-' + err);
                    } else {
                        // push thumbnail to server using the request module
                        var readStream = fs.createReadStream(thumbnailFile);
                        var posturl = serverUploadURL + 'thumb_' + filename;
                        readStream.on('open', function() {
                            // pipe the readstream data in to a post request (it will set the content type)
                            var pipepost = readStream.pipe(request.post(posturl));
                            pipepost.on('error', function(err) {
                                log.error('ERROR: couldnt to post thumb to server - make sure it is running');
                            });
                            pipepost.on('end', function() {
                                log.info('wrote thumbnail to ' + serverUploadURL);
                            });
                        });
                        readStream.on('error', function(err) {
                            log.error('ERROR: couldnt read thumbnail file for transmission to server');
                        });

                        if (argv.pushoriginal) {
                            // push original full sized file to server
                            var readStream2 = fs.createReadStream(originalFile);
                            var posturl2 = serverUploadOriginalURL + filename;
                            readStream2.on('open', function() {
                                // pipe the readstream data in to a post request (it will set the content type)
                                var pipepost2 = readStream2.pipe(request.post(posturl2));
                                pipepost2.on('error', function(err) {
                                    log.error('ERROR: couldnt to post full file to server - make sure it is running');
                                });
                                pipepost2.on('end', function() {
                                    log.info('wrote full file to ' + serverUploadOriginalURL);
                                });
                            });
                            readStream2.on('error', function(err) {
                                log.error('ERROR: couldnt read full file for transmission to server');
                            });
                        }
                    }
                });
        }, argv.timedelay);
    } else {
        log.trace('filename not provided, ignoring this event');
        return;
    }
});
