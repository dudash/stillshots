// still-pusher
// (C) 2013 Jason Dudash
// Licensed as GNU GPLv2
var fs = require('fs'),
    util = require('util');

// check command line
var dirToWatch = process.argv[2];
if (process.argv.length != 3) {
    console.log('got ' + process.argv.length + ' arguments on commandline - expecting 3');
    printUsage();
    process.exit(1);
}

// verify that the directory exists - do this synchronously because it needs to happen now
var exists = fs.existsSync(dirToWatch);
if (!exists) {
    console.log('Could not access directory \'' + dirToWatch + '\'');
    process.exit(1);
}

console.log('still-pusher: watching on directory \'' + dirToWatch + '\'');

// kick off a watch loop to see change events
fs.watch(dirToWatch, function(event, filename) {
    console.log('event is: ' + event);
    if (filename) {
        console.log('filename provided is: ' + filename);

        // TODO process file change

    } else {
        console.log('filename not provided, ignoring this event');
    }
});

//-----------------------------------------------------------------------------

function makeThumbnail() {
    // build a thumbnail out of the image file
}

//-----------------------------------------------------------------------------

function putThumbnail() {
    // TODO push new thumbnail and metatdata via HTTP to the server
}

//-----------------------------------------------------------------------------

function printUsage() {
    console.log('Usage: still-pusher [-options] directory_name');
    console.log('');
    console.log('where options include:');
    console.log('    - no options available yet');
}
