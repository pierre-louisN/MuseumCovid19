//var http = require('http');
//var key = process.env.USER_KEY
//var secret_key = process.env.SECRET_KEY
var express = require('express');
var socket = require('socket.io');
var app = express();
var fs = require('fs');
var server = app.listen(8080,function(){
	console.log('listening to requests on port 8080');
	console.log("Server running at http://127.0.0.1:8080");
});
app.use(express.static('public'));

var first = true; // checks if user connects for the first time to the home page

var io = socket(server);
var AWS = require('aws-sdk');
var uuid = require('uuid');
AWS.config.loadFromPath('./public/data/config.json'); //gets the credentials and loads them 
var rekognition = new AWS.Rekognition();

var redis = require('redis');
var client = redis.createClient();
client.flushall( function (err, succeeded) {
	if(succeeded){console.log('Database initiated')}; // will be true if successfull
});

client.select(0, function(err, reply){
	client.set('files loaded', '0');
	//console.log(client.selected_db);
});

//initializes the arrays and json that allows to display the treemap 
var fileTreemap = [];
var dataBefore= [];
var dataDuring= [];
var dataAfter= [];
fs.writeFileSync('./public/treemaps/treemap.json', JSON.stringify([], null, 2));
fs.writeFileSync('./public/treemaps/treemapbefore.json', JSON.stringify([], null, 2));
fs.writeFileSync('./public/treemaps/treemapduring.json', JSON.stringify([], null, 2));
fs.writeFileSync('./public/treemaps/treemapafter.json', JSON.stringify([], null, 2));



//update the Row with labels as key for the period 
function updateLabelsPeriod(labels,period){
	var db = getDatabase(period);
	console.log(db);
	labels.forEach(function(name){
		client.select(db, function (err,reply){
			console.log(reply);
			client.sadd('labels',name, function(err,reply){if(err){console.log('error in updating Labels')}});
		});
	});
}

// inserts the row in the correct database
function insertRowPeriod(name,country,instances,period){
	var db = getDatabase(period);
	//console.log(db);
	client.select(db, function(err,reply){
		var data = instances;
		client.hget(name, country, function(err, reply){ //checks if row already exists 
			if (reply==null){ //is if doesn't
				//console.log(data);
				client.hset(name, country, data, console.log); //creates the row
			}
			else { //updates with new value 
				var newData = data + parseInt(reply);
				console.log(newData);
				client.hset(name, country, newData, console.log);
			}
		});
	});

}



//update the array for the ALL Treemap
function updateFileTreemap(reply,nameLabel,country){
	for (var key in fileTreemap) {
		if(fileTreemap[key].key == nameLabel && fileTreemap[key].subregion == country){
	 		fileTreemap[key].value = parseInt(reply);
	 	}	
	}
}

// updates the JSON file with the Treemap for a selected period
function updateChartPeriod(country,period){
	var db = getDatabase(period);
	client.select(db, function (err, reply){
		client.smembers('labels', function(err, reply){
			console.log(country);
			//console.log(period);
			for (var i = 0; i < reply.length; i++) {
				var nameLabel = reply[i];
				writeJsonFilePeriod(nameLabel,country,period);
			} 
		});
	});
}

//write in the JSON File for the selected period the new data 
function writeJsonFilePeriod(nameLabel,country,period){
	var db = getDatabase(period);
	var filePath = './public/treemap'+period+'.json';
	client.select(db, function(err,reply){
		client.hget(nameLabel,country, function(err,reply){
			if(reply==null){
				console.log('object not found for country');
			}
			else {
				var data = getData(period);
				if(isInFilePeriod(nameLabel,country,data)){
					updateFileTreemapPeriod(reply,nameLabel,country,data);
				}
				else if (isInFile(nameLabel,country,data)){ //if data is in ALL Treemap but not in period Treemap
					addTreemapAll(reply,nameLabel,country,data);
					data.push({
					'key': nameLabel,
					'region': getContinent(country),
					'subregion': country,
					'value': parseInt(reply)
					});
				}
				else {
					data.push({ // writes data in the JSON file for the period
					'key': nameLabel,
					'region': getContinent(country),
					'subregion': country,
					'value': parseInt(reply)
					});
					fileTreemap.push({ //writes data in the ALL array
					'key': nameLabel,
					'region': getContinent(country),
					'subregion': country,
					'value': parseInt(reply)
					});
				}
				fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
				fs.writeFileSync('./public/treemap.json', JSON.stringify(fileTreemap, null, 2));
			}
		});
	});
}




//returns the array for the selected period
function getData(period){
	if(period=="before"){
		return dataBefore;
	}
	else if(period=="during"){
		return dataDuring;
	}
	else if(period=="after"){
		return dataAfter;
	}
	else {
		console.log('period invalid');
	}
}


//updates the array of the selected period with the new value
function updateFileTreemapPeriod(reply,nameLabel,country,data){
	for (var key in data) {
		if(data[key].key == nameLabel && data[key].subregion == country){
			updateTreemapAll(data[key].value,reply,nameLabel,country,data);
	 		data[key].value = parseInt(reply);	
	 	}	
	}
}

//adds the data to the ALL treemap via its array
function addTreemapAll(reply,nameLabel,country,data){
	var data = fileTreemap;
	for (var key in data) {
		if(data[key].key == nameLabel && data[key].subregion == country){
	 		data[key].value = data[key].value+parseInt(reply);	
	 	}
	}
}

//updates the data with new updated value by substracting the old value first
function updateTreemapAll(oldValue,newValue,nameLabel,country){
	var data = fileTreemap;
	for (var key in data) {
		if(data[key].key == nameLabel && data[key].subregion == country){
	 		data[key].value = data[key].value-parseInt(oldValue); 
	 		data[key].value = data[key].value+parseInt(newValue);
	 	}	
	}
}

//checks if the data is in the selected array
function isInFilePeriod(nameLabel,country,data){
	//var file = JSON.stringify(fileTreemap);
	//var data = dataTreemap;
	if(data.length>0){
		for (var key in data) {
			if(data[key].key ==nameLabel && data[key].subregion == country){
				return true;
			} 
		}
		return false;
	} 
	else{
		return false;
	}
}

//checks if the data is in the array that contains the data for all period
function isInFile(nameLabel,country){
	var data = fileTreemap;
	if(data.length>0){
		for (var key in data) {
			if(data[key].key ==nameLabel && data[key].subregion == country){
				return true;
			} 
		}
		return false;
	} 
	else{
		return false;
	}
}

//returns an array of the names for every object inserted in the selected database
function displayLabels(period){
	var db = getDatabase();
	client.select(db, function(err,reply){
		client.smembers('labels', function(err, reply){
			
			console.log(reply);
			
		});
	});
}

//returns the continent for the selected country
function getContinent(country){
	var file = fs.readFileSync('./public/data/countries.json');
	var data = JSON.parse(file);
	for (var key in data) {
		if (data.hasOwnProperty(key)) {
			if(country == data[key].key){
				return data[key].region;
				
			}
			
		}
	}	
}

//returns the number of the database for the selected period
function getDatabase(period){
	if(period=="before"){
		return 1;
	}
	else if(period=="during"){
		return 2;
	}
	else if(period=="after"){
		return 3;
	}
	else {
		console.log('period invalid');
	}
}

//return the value for specified period 
async function getValue(period, name, country, data, key){
	var db  = getDatabase(period);
	client.select(db, function (err, reply){
		client.hget(name, country, async function (err, reply){
			if(reply==null){
				data[key].value = 0;					
			}
			else {
				data[key].value = parseInt(reply);					
			}
			fs.writeFileSync('./public/data/countries2.json', JSON.stringify(data, null, 2));
		});
	});
	
}

//connects the socket with the server
io.on('connection',function(socket){
	console.log("Connection on : "+socket.id);
	
	//when the user sends his images and infos
	socket.on('loadFile', function (imageBytes, country,period) {
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
				socket.emit('afficheRes', data); //displays tables of the data
				console.log(data);
				var labels = [];
				for (let x = 0; x< data['Labels'].length; x++){
					var name = data['Labels'][x]['Name'];
					var confidence = data['Labels'][x]['Confidence'];
					var parents = data['Labels'][x]['Parents'];
					var instances = (data['Labels'][x]['Instances'].length>0) ? data['Labels'][x]['Instances'].length : 1; 
					labels.push(name);
					insertRowPeriod(name,country,instances,period);
				}
			updateLabelsPeriod(labels,period);
			updateChartPeriod(country,period);
			console.log('Data have been added to database');
			}
		});
	}); 
	
	//returns the number of files in the entire database
	socket.on('getNumberFiles', function(nameLabel){
		client.select(0, function(err, reply){
			client.get("files loaded", function(err, reply) {
				console.log('Number of files loaded : ' + reply);
				socket.emit('treemap', reply, nameLabel); //displays the ALL Treemap for the page
			});
		});
	});
		
	//returns the number of object for the selected period
	socket.on('getObject', function(period){
		var db = getDatabase(period);
		client.select(db, function(err,reply){
			client.smembers('labels', function (err,reply){
				console.log('there is '+reply.length+' objects in the database');
				socket.emit('displayTreemap', reply.length);
			});
		});
	});
	
	//returns the list of names for the selected period
	socket.on('getLabels', function(period){
		var db = getDatabase(period);
		client.select(db, function(err,reply){
			client.smembers('labels', function(err, reply){
				console.log('There is currently '+reply.length+' in database n°'+db);
				socket.emit('listLabels',reply); //dropdown list with every selectable name
			});
		});
		
	});
	
	//tests if it's the first time that the user connects to the home page
	socket.on('test', function(){
		var resp;
		if (first == true){
			first = false;
			resp = true;
		}
		else {
			resp = false;
		}
		socket.emit('response', resp);
	});
	
	//updates the json file that displays the treemap with the selected object for the period
	socket.on('updateFile', async function(nameLabel, period){
			console.log('updating file');
			var file = fs.readFileSync('./public/data/countries.json');
			var data = JSON.parse(file);
			for (var key in data) {
				if (data.hasOwnProperty(key)) { 
					country = data[key].key;
					data[key].value = 0;
					var test = await getValue(period, nameLabel,country, data, key);
				}
			}
	});
});
