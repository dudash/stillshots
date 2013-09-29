still-pusher
==============================================================================
a simple node.js REST client app to watch a directory of images files and push
new image contents to a REST based server


Author(s)
-------------------------------------------------------------------------------
[@thenut77](http://twitter.com/)


Run Notes
-------------------------------------------------------------------------------
To run:
1) git clone
2) npm install
3) node still-pusher.js [options]


Debug Notes
-------------------------------------------------------------------------------
To run in debug mode with pretty printed bunyan logs, use: 
> LOG_LEVEL=debug NODE_DEBUG=true node still-pusher.js | ./node_modules/.bin/bunyan

There is a test image in the data directory that you can use to test pushes


Version Release Notes
-------------------------------------------------------------------------------
No Releases