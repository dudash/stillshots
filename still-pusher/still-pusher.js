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
default ('d', '.')
    .demand('d')
    .alias('d', 'watchdir')
    .describe('d', 'Directory to watch for stills')
    .
default ('r', 'http://127.0.0.1')
    .alias('r', 'remotehost')
    .describe('r', 'Remote host to push thumbnails to')
    .
default ('p', '8080')
    .alias('p', 'remoteport')
    .describe('p', 'Remote port to push thumbnails to');
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

var serverUploadURL = argv.remotehost + ':' + argv.remoteport + '/uploads/';
log.debug('still-pusher pushing thumbs to server\'' + serverUploadURL + '\'');

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

        // build thumbnail as 150x150 and strip metadata
        var thumbnailFile = argv.watchdir + '/thumbs/thumb_' + filename;
        gm(filename)
            .noProfile()
            .resize(150, 150)
            .write(thumbnailFile, function(err) {
                if (err) {
                    log.error('ERROR: gm failed to create thumbnail ' + thumbnailFile);
                } else {
                    // push thumbnail to server using the request module
                    var readStream = fs.createReadStream(thumbnailFile);
                    var posturl = serverUploadURL + 'thumb_' + filename;
                    readStream.on('open', function() {
                        // pipe the readstream data in to a post request (it will set the content type)
                        var pipepost = readStream.pipe(request.post(posturl));
                        pipepost.on('error', function(err) {
                            log.error('ERROR: couldnt to post to server - make sure it is running');
                        });
                        pipepost.on('end', function() {
                            log.info('wrote thumbnail to ' + serverUploadURL);
                        });
                    });
                    readStream.on('error', function(err) {
                        log.error('ERROR: couldnt read thumbnail file for transmission to server');
                    });
                }
            });
    } else {
        log.trace('filename not provided, ignoring this event');
        return;
    }
});
