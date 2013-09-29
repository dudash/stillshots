// still-pusher
// https://github.com/thenut77/stillshots
// (C) 2013 Jason Dudash, All Rights Reserved
// Licensed as GNU GPLv2
var http = require('http'),
    fs = require('fs'),
    moment = require('moment'),
    sys = require('sys'),
    restify = require('restify'),
    bunyan = require('bunyan'),
    connect = require('connect');

var optimist = require('optimist')
    .usage('Usage: $0')
    .alias('h', 'help')
    .demand('f')
    .alias('f', 'cfgfile')
    .describe('f', 'Config file to provide as a resouce')
    .alias('d', 'dynamic')
    .describe('d', 'Use a dynamic smart configuration (currently just a file reload)');
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

log.debug('still-server saving uploads under directory \'uploads\'');
try {
    fs.mkdirSync('./uploads');
} catch (e) {
    if (e.code != 'EEXIST') {
        throw e;
    }
}

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
server.use(restify.requestLogger());

// AUDIT LOG
server.on('after', restify.auditLogger({
    log: log
}));

// GET main page
server.get('/', function(req, res, next) {
    var body = '<html><body><h1>still-server is running</h1>';
    body += 'upload with POST data to /uploads/:name</br>';
    body += 'get config at <a href=\'./config.json\'>/config.json</a></br>';
    body += 'see thumbs at <a href=\'./thumbs\'>/thumbs</a>';
    body += '</body></html>';
    res.writeHead(200, {
        'Content-Length': Buffer.byteLength(body),
        'Content-Type': 'text/html'
    });
    res.write(body);
    res.end();
    return next();
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
    return next();
});

// GET thumbnails page
server.get('/thumbs', function(req, res, next) {
    log.debug('responding with thumbnails list');
    // asynchronously read the upload files
    fs.readdir('./uploads/', function(err, files) {
        if (err) {
            log.warn('Error getting files in upload path: ' + err);
            res.send('Error getting thumbnails');
        }
        /*
        files.sort(function(a, b) {
            return fs.statSync(dir + a).mtime.getTime() -
                fs.statSync(dir + b).mtime.getTime();
        });*/
        log.debug('files list is:' + files);
        log.debug('building HTML page to display thumbs');
        // respond with page and list every image file
        var body = '<html><body><h2>Uploaded Thumbnails</h2>';
        files.forEach(function(filename) {
            body += '<img src=\'./uploads/' + filename + '\'/>';
        });
        body += '</body></html>';
        res.writeHead(200, {
            'Content-Length': Buffer.byteLength(body),
            'Content-Type': 'text/html'
        });
        res.write(body);
        res.end();
    });
    return next();
});

// GET thumbnail images
var staticThumbsServer = connect.static(__dirname + '/uploads');
server.get(/\/uploads\/*/, function(req, res, next) {
  req.url = req.url.substr('/uploads'.length); // take off leading path so that connect locates it correctly
  return staticThumbsServer(req, res, next);
});

// POST new thumbnail to server
server.post('/uploads/:name', function(req, res, next) {
    res.log.debug(req.params, 'uploads got a POST for ' + req.params.name);
    var outfile = './uploads/' + req.params.name;
    var writeStream = fs.createWriteStream(outfile);
    log.debug('about to pipe resource body in to: ' + outfile);
    req.pipe(writeStream);
    writeStream.on('close', function() {
        log.debug('end write to uploaded file');
        req.end();
    });
    req.on('end', function() {
        log.debug('end client request, sending OK to requestor');
        res.send(200, {
            ok: 'ok'
        });
    });
    writeStream.on('error', function(err) {
        log.debug('couldnt write uploaded file: ' + err);
    });
    return next();
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
