//var http = require('http');
var express = require('express');
var socket = require('socket.io');
var app = express();
var fs = require('fs');
var server = app.listen(8080,function(){
	console.log('listening to requests on port 8080');
});
app.use(express.static('public'));


var io = socket(server);
var AWS = require('aws-sdk');
var uuid = require('uuid');
AWS.config.loadFromPath('./public/config.json');
var rekognition = new AWS.Rekognition();

var redis = require('redis');
var client = redis.createClient();
client.set('files loaded', '0');

io.on('connection',function(socket){
	console.log("Server running at http://127.0.0.1:8080");
	
	socket.on('loadFile', function (imageBytes,infos) {
		// On récupère le pseudo de celui qui a cliqué dans les variables de session
		console.log('User has sent an image');
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
				//console.log(data.Labels.length);
				//console.log(infos);
				//var buf = Buffer.from(JSON.stringify(data)); // pour récupérer json à partir de bufffer : var data = JSON.parse(buf.toString());
				//var tab = JSON.parse(data);
				//console.log(buf);
				//var client = redis.createClient(8080, '120.0.0.1'); provoque une erreur au bout de quelques secondes et renvoi false quand set est utilisé 
				//client.set(params.Image.Bytes, data); erreur quand on essaye d'ajouter des objets, accepté que dates, strings et buffer
				//client.set(params.Image.Bytes,buf); 
				//client.hmset(imageBytes, infos);
				/*const arr = Object.keys(data).map((key) => [key, data[key]]);
				console.log(arr);
				for (let x = 0; x>=data.Labels.length; x++){
					client.set(data.Labels[x].Name,data.Labels[i].Confidence);
				}*/
				/*var json = data['Labels'];
				console.log(data['Labels'][0]);
				console.log(data['Labels'][0]['Name']);*/
				//console.log(json);
				/*console.log(data['Labels'][0]['Instances'].length);
				console.log(data['Labels'][8]['Instances'].length);*/
				for (let x = 0; x< data['Labels'].length; x++){
					var name = data['Labels'][x]['Name'];
					var confidence  = data['Labels'][x]['Confidence'];
					var instances = (data['Labels'][x]['Instances'].length>0) ? data['Labels'][x]['Instances'].length : 1; 
					const infos2 = ["nameLabels",name,"instances",instances,"confidence",confidence];
					const infosimg = infos.concat(infos2);
					console.log(infosimg);
					client.hmset(imageBytes,infosimg);
				}
				//client.hmset(params.Image.Bytes,data.Labels);
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

});
