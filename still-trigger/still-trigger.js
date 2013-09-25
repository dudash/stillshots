// still-trigger
// (C) 2013 Jason Dudash
// GNU GPL v2

var sys = require('sys'),
    http = require('http'),
    fs = require('fs'),
    moment = require('moment'),
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
default ('r', 'http://127.0.0.1')
    .alias('r', 'remotehost')
    .describe('r', 'Remote host to get configuration from')
    .
default ('p', '3000')
    .alias('p', 'remoteport')
    .describe('p', 'Remote port to get configuration from')
    .
default ('o', '30')
    .alias('o', 'remotetimeout')
    .describe('o', 'Timeout in seconds to poll the config server');
var argv = optimist.argv;
if (argv.help) {
    optimist.showHelp();
    process.exit(0);
}

var commandexec = argv.exec;
var extraconfig = ''; // we will fill this out as needed from config
var imageconfig = ''; // we will fill this out as needed from config
var outputcmd = '-o ./still.png'; // this will change based on the config

console.log(process.argv[1] + ': running');

// load in the configuration file if specified
if (argv.cfgfile.length > 1) {
    console.log('DEBUG: using local config ' + argv.cfgfile);
    try {
        var fileContents = fs.readFileSync(argv.cfgfile, 'utf8');
        var configData = JSON.parse(fileContents);
        parseConfigData(configData);
    } catch (ex) {
        console.log('Error! config file is corrupt or missing');
        process.exit(1);
    }
} else {
    // setup a timeout to poll the remote server for config updates
    var cfgIntervalId = setInterval(function() {
        var url = 'http://' + argv.remotehost + ':' + argv.remoteport + '/config.json';
        console.log('DEBUG: fetching config from:' + url);
        http.get(url,
            function(res) {
                var body = '';
                res.on('data', function(chunk) {
                    body += chunk;
                });
                res.on('end', function() {
                    var configdata = JSON.parse(body);
                    //console.log("DEBUG: got response: ", JSON.stringify(configdata));
                    parseConfigData(configdata);
                });
            }).on('error', function(e) {
            console.log("Error! could not get remote config, details: ", e);
        });
    }, argv.remotetimeout * 1000);
}

// setup a timeout callback to exec commands
var stillIntervalId = setInterval(function() {
    console.log("INFO: still-trigger: taking a stillshot");
    setOutputCommandLine();
    var joinedcommand = commandexec + ' ' + extraconfig + ' ' + imageconfig + ' ' + outputcmd;
    //console.log("DEBUG: cmd = " + joinedcommand);
    var child = exec(joinedcommand,
        function(error, stdout, stderr) {
            if (stdout !== '') {
                console.log('stdout:\n' + stdout);
            }
            if (stderr !== '') {
                console.log('stderr:\n' + stderr);
            }
            if (error !== null) {
                console.log('exec error: \n[' + error + ']');
            }
        });
}, argv.timeout * 1000);

//-----------------------------------------------------------------------------

function setOutputCommandLine() {
    var outpath = './timelapse'; // TODO make this configurable
    var outfilename = moment().format('YYYY-MM-DDTHH-mm-ss');
    outputcmd = '-o ' + outpath + '/' + outfilename;
}

//-----------------------------------------------------------------------------

function parseConfigData(configData) {
    //console.log('DEBUG: parsing config from ' + JSON.stringify(configData));
    extraconfig = configData['extraconfig'];
    imageconfig = configData['imageconfig'];
}
