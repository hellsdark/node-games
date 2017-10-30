// express
var express = require('express');
var fs = require('fs');
var app = express();
var config = require('./config');
var root = config.root;


//
// web server (express) configuration and start
//
app.use(express.static(root+'/'));


var server = app.listen(3005, function(){
    var host = server.address().address;
    var port = server.address().port;

    console.log('Running at http://%s:%s',host,port);
    console.log('Root : '+config.root);
});
