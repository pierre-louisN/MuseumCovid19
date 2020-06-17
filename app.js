var http = require('http');

var fs = require('fs');
var AWS = require('aws-sdk');
var uuid = require('uuid');
AWS.config.loadFromPath('./config.json');
var rekognition = new AWS.Rekognition();

var redis = require('redis');
var client = redis.createClient();
//var client = redis.createClient('8080', '120.0.0.1');
client.set('files loaded', '0');
//var client = redis.createClient(8080, '120.0.0.1');
// Chargement du fichier index.html affiché au client
var server = http.createServer(function(req, res) {
	fs.readFile('./index.html', 'utf-8', function(error, content) {
		res.writeHead(200, {"Content-Type": "text/html"});
		res.end(content);
	});
});

// Chargement de socket.io
var io = require('socket.io').listen(server);


io.sockets.on('connection', function (socket, pseudo) {
	// Quand un client se connecte, on lui envoie un message
	socket.emit('message', 'Vous êtes bien connecté !');
	// On signale aux autres clients qu'il y a un nouveau venu
	socket.broadcast.emit('message', 'Un autre client vient de se connecter ! ');

	// Dès qu'on nous donne un pseudo, on le stocke en variable de session
	socket.on('petit_nouveau', function(pseudo) {
		socket.pseudo = pseudo;
	});

	// Dès qu'on reçoit un "message" (clic sur le bouton), on le note dans la console
	socket.on('message', function (message) {
		// On récupère le pseudo de celui qui a cliqué dans les variables de session
		console.log(socket.pseudo + ' me parle ! Il me dit : ' + message);
	}); 

	socket.on('loadFile', function (imageBytes) {
		// On récupère le pseudo de celui qui a cliqué dans les variables de session
		console.log('utilisateur a envoye une image');
		var params = {
			Image: {
			Bytes: imageBytes
			}
		};
		rekognition.detectLabels(params, function(err, data) {
			if (err){
				console.log(params, err, err.stack); // an error occurred
			}
			else  {
				socket.emit('afficheRes', data);
				//client.set(params, data);
				console.log(data);
				console.log(data.Labels.length);
				
				var buf = Buffer.from(JSON.stringify(data)); // pour récupérer json à partir de bufffer : var data = JSON.parse(buf.toString());
				console.log(buf);
				//var client = redis.createClient(8080, '120.0.0.1'); provoque une erreur au bout de quelques secondes et renvoi false quand set est utilisé 
				//client.set(params.Image.Bytes, data); erreur quand on essaye d'ajouter des objets, accepté que dates, strings et buffer
				//client.set(params.Image.Bytes,buf); 
				//client.hmset("key", ["hello", "world"])
				for (let x = 0; x>=data.Labels.length; x++){
					client.set(data.Labels[x].Name,data.Labels[i].Confidence);
				}
				client.incr('files loaded');
				//client.get("files loaded", function(err, value) {console.log(value)})
				console.log('Data have been added to database');
				/*var value = client.get('files loaded', function(err, reply) {
					//console.log(reply);
					return reply;
				});
				console.log('Number of files loaded : ' + value);*/
				client.get("files loaded", function(err, reply) {
					// reply is null when the key is missing
					console.log('Number of files loaded : ' + reply);
				});
				//socket.on('addDatabase', params, data);
			}

		});
	}); 
	
	/*socket.on('addDatabase', function(err, data) {
		if (err){
			console.log('Error in adding data to database');
			console.log(err, err.stack);
		}
		else {
			var redis = require('redis');
			var client = redis.createClient(8080, '120.0.0.1');
			console.log('No error data will be added to database');
			client.set(params, data);
			console.log('Data have been added to database');
		}
	});*/
});



/*client.on('connect', function() {
console.log('connected to redis database');
});*/


server.listen(8080);
console.log("Server running at http://127.0.0.1:8080");
