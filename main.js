var redis = require('redis')
var multer  = require('multer')
var express = require('express')
var fs      = require('fs')
var app = express()
// REDIS
var key_count = 0;
var recent_key = "recent_urls";
var client = redis.createClient(6379, '127.0.0.1', {})

app.use(function(req, res, next) 
{
	console.log(req.method, req.url);

	client.lpush([recent_key, req.url], function(err, reply){
		console.log("reply: "+reply);
	});
	client.ltrim(recent_key, 0, 4);

	next(); // Passing the request to the next handler in the stack.
});

var sendResponse = function(response, message) {
	message = "Message from server at port "+start_port[0]+"<br />"+message;
	response.send(message);
};

///////////// WEB ROUTES
app.get('/', function(request, response) {
	sendResponse(response, "Home page at port "+start_port[0]);
});

app.get('/set', function(request, response) {
	client.set("key0", "this message will self destruct in 10 seconds.");
	client.expire("key0", 10);
	sendResponse(response, "Value set");
});

app.get('/get', function(request, response) {
	client.get("key0", function(err, value){
		if(err != null){
			value = "No value found";
		}
		if(value == null)
			value = "Message expired";
		sendResponse(response, value);
	});
});

app.get('/expire', function(request, response) {
	client.del("key0");
	sendResponse(response, "Saved value destructed");
});

// Add hook to make it easier to get all visited URLS.

app.get('/recent', function(request, response){
	client.lrange(recent_key, 0, -1, function(err, list){
		var len = list==null ? 0 : list.length;
		var urls = ""
		for(var i=0; i<len; i++) {
			console.log(list[i]);
			urls += list[i]+"<br>";
		}
		sendResponse(response, urls);
	});
});

var pic_key = "pickey";

app.post('/upload',[ multer({ dest: './uploads/'}), function(req, res){
   console.log(req.body) // form fields
   console.log(req.files) // form files

   if( req.files.image )
   {
	   fs.readFile( req.files.image.path, function (err, data) {
	  		if (err) throw err;
	  		var img = new Buffer(data).toString('base64');
	  		client.rpush([pic_key, img], function(err, reply){
	  			if(err) throw err;
				console.log("Pushed against key");
			});
		});
	}

   res.status(204).end()
}]);

app.get('/meow', function(req, res) {
	{
		//if (err) throw err
		res.writeHead(200, {'content-type':'text/html'});
		var items = client.lpop(pic_key, function(err, value){
			
			if(err) throw err;
			if(value == undefined)
				res.write('<h1>No images to display</h1>');
			else
	   			res.write("<h1>\n<img src='data:my_pic.jpg;base64,"+value+"'/>");
			
	   		res.end();
		});
	}
})

var start_port = process.argv.slice(2);

// HTTP SERVER
var server = app.listen(start_port[0], function () {

  var host = server.address().address
  var port = server.address().port

  console.log('Example app listening at http://%s:%s', host, port);
});
