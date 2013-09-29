// still-trigger
// (C) 2013 Jason Dudash
// GNU GPL v2

var sys = require('sys'),
    http = require('http'),
    fs = require('fs'),
    moment = require('moment'),
    bunyan = require('bunyan'),
    exec = require('child_process').exec;

var optimist = require('optimist')
    .usage('Usage: $0')
    .alias('h', 'help')
    .
default ('x', 'raspistill')
    .alias('x', 'exec')
    .describe('x', 'Executable filename for taking stillshots')
    .
default ('t', '168')
    .alias('t', 'timeout')
    .describe('t', 'Timeout in seconds between shots')
    .
default ('f', '')
    .alias('f', 'cfgfile')
    .describe('f', 'Local config file to use (negates any remote server)')
    .
default ('o', './latestshots')
    .alias('o', 'outputpath')
    .describe('o', 'Directory to output the timelapse pictures')
    .
default ('r', 'http://127.0.0.1')
    .alias('r', 'remotehost')
    .describe('r', 'Remote host to get configuration from')
    .
default ('p', '8080')
    .alias('p', 'remoteport')
    .describe('p', 'Remote port to get configuration from')
    .
default ('i', '30')
    .alias('i', 'remotetimeout')
    .describe('i', 'Timeout in seconds to poll the config server');
var argv = optimist.argv;
if (argv.help) {
    optimist.showHelp();
    process.exit(0);
}

var commandexec = argv.exec;
var extraconfig = ''; // we will fill this out as needed from config
var imageconfig = ''; // we will fill this out as needed from config
var outputcmd = '-o ./still.png'; // this will change based on the config

var log = bunyan.createLogger({
    name: 'still-trigger-logger',
    level: process.env.LOG_LEVEL || 'info',
    stream: process.stdout,
    serializers: bunyan.stdSerializers
});

log.info(process.argv[1] + ': running');

// load in the configuration file if specified
if (argv.cfgfile.length > 1) {
    log.debug('using local config ' + argv.cfgfile);
    try {
        var fileContents = fs.readFileSync(argv.cfgfile, 'utf8');
        var configData = JSON.parse(fileContents);
        parseConfigData(configData);
    } catch (ex) {
        log.fatal('Error! config file is corrupt or missing');
        process.exit(1);
    }
} else {
    // setup a timeout to poll the remote server for config updates
    var cfgIntervalId = setInterval(function() {
        var url = 'http://' + argv.remotehost + ':' + argv.remoteport + '/config.json';
        log.debug('fetching config from:' + url);
        http.get(url,
            function(res) {
                var body = '';
                res.on('data', function(chunk) {
                    body += chunk;
                });
                res.on('end', function() {
                    var configdata = JSON.parse(body);
                    log.trace("got response: ", JSON.stringify(configdata));
                    parseConfigData(configdata);
                });
            }).on('error', function(e) {
            log.error("Error! could not get remote config, details: ", e);
        });
    }, argv.remotetimeout * 1000);
}

// setup a timeout callback to exec commands
var stillIntervalId = setInterval(function() {
    log.info("still-trigger: taking a stillshot");
    setOutputCommandLine();
    var joinedcommand = commandexec + ' ' + extraconfig + ' ' + imageconfig + ' ' + outputcmd;
    log.trace("cmd = " + joinedcommand);
    var child = exec(joinedcommand,
        function(error, stdout, stderr) {
            if (stdout !== '') {
                log.info('stdout:\n' + stdout);
            }
            if (stderr !== '') {
                log.info('stderr:\n' + stderr);
            }
            if (error !== null) {
                log.info('exec error: \n[' + error + ']');
            }
        });
}, argv.timeout * 1000);

//-----------------------------------------------------------------------------

function setOutputCommandLine() {
    // TODO check if output path exists and if not create it
    var outfilename = moment().format('YYYY-MM-DDTHH-mm-ss');
    outputcmd = '-o ' + argv.outputpath + '/' + outfilename;
}

//-----------------------------------------------------------------------------

function parseConfigData(configData) {
    log.trace('parsing config from ' + JSON.stringify(configData));
    extraconfig = configData['extraconfig'];
    imageconfig = configData['imageconfig'];
}
