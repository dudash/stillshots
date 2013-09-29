// still-pusher
// (C) 2013 Jason Dudash
// Licensed as GNU GPLv2
var http = require('http'),
    fs = require('fs'),
    moment = require('moment'),
    sys = require('sys'),
    restify = require('restify'),
    bunyan = require('bunyan');

var optimist = require('optimist')
    .usage('Usage: $0')
    .alias('h', 'help')
    .demand('f')
    .alias('f', 'cfgfile')
    .describe('f', 'Config file to provide as a resouce')
    .alias('d', 'dynamic')
    .describe('d', 'Use a dynamic smart configuration (TODO just a file reload for now)');
var argv = optimist.argv;
if (argv.help) {
    optimist.showHelp();
    process.exit(0);
}

var log = bunyan.createLogger({
    name: 'still-server-logger',
    level: process.env.LOG_LEVEL || 'info',
    stream: process.stdout,
    serializers: bunyan.stdSerializers
});

var configData;
if (argv.cfgfile.length > 0) {
    parseDefaultStillConfig();
} else {
    log.fatal('Error! please specify a config file');
    process.exit(1);
}

var hostport = 8080;
var server = restify.createServer({
    log: log,
    name: 'still-server',
    version: '1.0.0'
});

server.use(restify.acceptParser(server.acceptable));
//server.use(restify.bodyParser());
server.use(restify.requestLogger());

// AUDIT
server.on('after', restify.auditLogger({
    log: log
}));

// GET main page
server.get('/', function(req, res, next) {
    res.send('Still server is running and accepting thumbnail uploads');
});

// GET config data as json
server.get('/config.json', function(req, res, next) {
    log.debug('responding with json configuration');
    if (argv.dynamic) {
        buildDynamicStillConfig();
    }
    log.debug('data = ' + JSON.stringify(configData));
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(configData));
});

// GET thumbnails page
server.get('/thumbs', function(req, res, next) {
    res.send('TODO display uploaded thumbnails');
});

// POST new thumbnail to server
server.post('/uploads/:name', function(req, res, next) {

    // TODO is this form data that we cant handle?

    res.log.debug(req.params, 'uploads got a POST for ' + req.params.name);
    var writeStream = fs.createWriteStream(req.params.name);
    req.pipe(writeStream);

    writeStream.on('close', function() {
        log.debug('DEBUG: end write to file');
        req.end();
    });

    req.on('end', function() {
        log.debug('DEBUG: end request, sending OK to requestor');
        res.send(200, {
            ok: 'ok'
        });
    });

    writeStream.on('error', function(err) {
        log.debug('ERROR: couldnt write file: ' + err);
    });

    return next();
    // TODO call next?

});

server.listen(hostport, function() {
    log.info('%s listening at %s', server.name, server.url);
});

//-----------------------------------------------------------------------------

function parseDefaultStillConfig() {
    try {
        var fileContents = fs.readFileSync(argv.cfgfile, 'utf8');
        configData = JSON.parse(fileContents);
    } catch (ex) {
        log.fatal('Error! config file is corrupt or missing');
        process.exit(1);
    }
}

//-----------------------------------------------------------------------------

function buildDynamicStillConfig() {
    log.debug('DEBUG: TODO build dynamic config');

    // TODO respond with configuration optimized for weather and timeof day

    // for now just reparse the file we loaded
    parseDefaultStillConfig();
}
