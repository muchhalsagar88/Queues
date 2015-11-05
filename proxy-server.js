var http      = require('http');
var httpProxy = require('http-proxy');
var redis = require('redis');
var spawn = require('child_process').spawn;

var client = redis.createClient(6379, '127.0.0.1', {})
var servers = process.argv[2] || 2, server_port = 7000, server_key = "servers";

var pushCallback = function(err, reply) {
	if(err) throw err;
	console.log('Pushed to redis with reply: '+reply);
};

var server_procs = [];
for(var i=0; i<servers; ++i) {
  var port = server_port + i;
  server_procs[i] = spawn('node', ['main.js', port]);
  var url = 'http://localhost:'+port;
  client.rpush([server_key, url], pushCallback);
}

var options = {};
var proxy   = httpProxy.createProxyServer(options);

var server  = http.createServer(function(req, res) {
  var proxy_url;
  client.lpop(server_key, function(err, reply){
	if(err) throw err;
	console.log("Redirecting request to "+reply);
	proxy.web(req, res, { target: reply });
	client.rpush([server_key, reply], pushCallback);
  });

});
server.listen(8090);

var terminate_children = function() {
	client.del(server_key);
	for(var i=0; i<server_procs.length; ++i) 
		server_procs[i].kill('SIGHUP');
	process.exit();
};

process.on('error', function(){terminate_children();} );
process.on('exit', function(){terminate_children();} );
process.on('SIGINT', function(){terminate_children();} );
process.on('uncaughtException', function(err){
  console.error(err);
  terminate_children();
});
