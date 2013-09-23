// still-pusher
// (C) 2013 Jason Dudash
// Licensed as GNU GPLv2
var http = require('http'),
    sys = require('sys');

var hostip = "127.0.0.1";
var hostport = 3000;

var server = http.createServer(function(req, res) {

    console.log('== got a ' + req.method + ' request for ' + res.url + '==');

    if (req.url == '/') {
        console.log('  - responding with homepage');
        res.writeHead(200);
        res.end('Welcome to the Still Server');
    } else if (req.method == "GET" && req.url == '/config.json') {
        console.log('  - responding with json configuration');
        res.writeHead(200, {
            'Content-Type': 'application/json'
        });
        res.end(JSON.stringify(getDefaultStillConfig()));
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
console.log('Server running at ' + hostip + ':' + hostport);

function getDefaultStillConfig() {

	// TODO respond with configuration optimized for weather and timeof day

    return {
        "exec": "raspistill"
    };
}
