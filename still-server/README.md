still-server
==============================================================================
a simple node.js server app that opens a REST interface allowing images to
be uploaded in to storage as well as proivdes configuration data resources
to clients requesting stillshot cfg.


Author(s)
-------------------------------------------------------------------------------
[@thenut77](http://twitter.com/)


Run Notes
-------------------------------------------------------------------------------
To run:
1) git clone
2) npm install
3) node still-server.js [options]


Version Release Notes
-------------------------------------------------------------------------------
To run in debug mode with pretty printed bunyan logs, use: 
  > LOG_LEVEL=debug node still-server.js -f ./example_config.json | ./node_modules/.bin/bunyan
