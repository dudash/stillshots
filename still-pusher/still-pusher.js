// still-pusher
// (C) 2013 Jason Dudash
// Licensed as GNU GPLv2
var fs = require('fs'),
    util = require('util');

var optimist = require('optimist')
    .usage('Usage: $0')
    .alias('h', 'help')
    .
default ('d', '.')
    .demand('d')
    .alias('d', 'watchdir')
    .describe('d', 'Directory to watch for stills');
var argv = optimist.argv;
if (argv.help) {
    optimist.showHelp();
    process.exit(0);
}

// verify that the directory exists - do this synchronously because it needs to happen now
var exists = fs.existsSync(argv.watchdir);
if (!exists) {
    console.log('Error: Could not access directory \'' + argv.watchdir + '\'');
    process.exit(1);
}

console.log('INFO: still-pusher watching on directory \'' + argv.watchdir + '\'');

// kick off a watch loop to see change events
fs.watch(argv.watchdir, function(event, filename) {
    console.log('event is: ' + event);
    if (filename) {
        console.log('DEBUG: filename provided is: ' + filename);

        // TODO process file change
        // build thumbnail
        // push thumbnail to server

    } else {
        console.log('Error: filename not provided, ignoring this event');
    }
});

//-----------------------------------------------------------------------------

function makeThumbnail() {
    // TODO build a thumbnail out of the image file
}

//-----------------------------------------------------------------------------

function putThumbnail() {
    // TODO push new thumbnail and metatdata via HTTP to the server
}
