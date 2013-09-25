// still-pusher
// (C) 2013 Jason Dudash
// Licensed as GNU GPLv2
var http = require('http'),
    fs = require('fs'),
    moment = require('moment'),
    sys = require('sys');

var optimist = require('optimist')
    .usage('Usage: $0')
    .alias('h', 'help')
    .demand('f')
    .alias('f', 'cfgfile')
    .describe('f', 'Config file to provide as a resouce');
var argv = optimist.argv;
if (argv.help) {
    optimist.showHelp();
    process.exit(0);
}

var configData;
if (argv.cfgfile.length > 0) {
    parseDefaultStillConfig();
} else {
    console.log('Error! please specify a config file');
    process.exit(1);
}

var hostip = "127.0.0.1";
var hostport = 3000;
var server = http.createServer(function(req, res) {
    console.log('DEBUG: got a ' + req.method + ' request for ' + req.url);
    if (req.url == '/') {
        console.log('DEBUG: - responding with homepage');
        res.writeHead(200);
        res.end('Welcome to the Still Server');
    } else if (req.method == "GET" && req.url == '/config.json') {
        console.log('DEBUG: - responding with json configuration');
        res.writeHead(200, {
            'Content-Type': 'application/json'
        });
        res.end(JSON.stringify(configData));
    } else if (req.method == "GET" && req.url == '/thumbs') {
        console.log('  - TODO show thumbs');

        // TODO display a list of the still images that have been uploaded

        res.end();
    } else if (req.method == "PUT") {
        console.log('  - TODO accept incoming data');

        // TODO accept images input

        res.end();
    } else {
        console.log('  - responding with error message');
        res.writeHead(404);
        res.end('requested resource not found');
    }
});
server.listen(hostport, hostip);
console.log('INFO: server running at ' + hostip + ':' + hostport);

//-----------------------------------------------------------------------------

function parseDefaultStillConfig() {
    try {
        var fileContents = fs.readFileSync(argv.cfgfile, 'utf8');
        configData = JSON.parse(fileContents);
    } catch (ex) {
        console.log('Error! config file is corrupt or missing');
        process.exit(1);
    }
}

//-----------------------------------------------------------------------------

function buildDynamicStillConfig() {

    // TODO respond with configuration optimized for weather and timeof day

    return {
        "imageconfig": "-vs -ex auto -awb auto -ifx none --m average",
        "extraconfig": "-v -n -t 0"
    }

}
