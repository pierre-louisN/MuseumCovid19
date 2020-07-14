var socket = io.connect('http://localhost:8080');
console.log("Ce programme JS vient d'être chargé");
$(document).ready(function()
{
	console.log("Le document est prêt");
	var region;
	var subregion;
	
	/*gapi.load('auth2', function(){
		gapi.auth2.init();
	});*/
	
	const queryString = window.location.search;
	const urlParams = new URLSearchParams(queryString);
	//var country = urlParams.get('country');
	var lang = urlParams.get('lang');
	console.log(lang);
	window.onload = function googleTranslateElementInit() {
		console.log('ici')
		new google.translate.TranslateElement({ pageLanguage: lang, layout: google.translate.TranslateElement.InlineLayout.SIMPLE }, 'google_translate_element');
		//google.translate.TranslateElement().c = lang
	}
	//google.translate.TranslateElement().c = lang;
	//dropdown list from json file
	let dropdown = $('#country');
	dropdown.empty();
	dropdown.append('<option selected="true" disabled>Choose State/Province</option>');
	dropdown.prop('selectedIndex', 0);
	// Populate dropdown with list of provinces
	/*$.getJSON('country.json', function (data) {
		$.each(data, function (key, entry) {
			dropdown.append($('<option></option>').attr('value', entry.abbreviation).text(entry.name));
		})
	});*/
	
	$.getJSON('countries.json', function (data) {
		$.each(data, function (key, entry) {
			dropdown.append($('<option></option>').attr('value', entry.key).text(entry.key));
		})
	});
		
		
	document.getElementById("fileToUpload").addEventListener("change", function (event, input) {
		input = this;
		console.log('image has changed');
		if (input.files && input.files[0]) {
			var reader = new FileReader();

			reader.onload = function (e) {
				$('#imageAws')
				.attr('src', e.target.result)
				.width(450)
				.height(300);
			};

			reader.readAsDataURL(input.files[0]);
		}
	});
	
	function getParentsName(data){
		if(data.length>0){
			var names = " ";
			data.forEach(function(items){
				console.log(items.Name);
				names += items.Name+", ";
			});
			return names
		}
		else {
			return "No parents";
		}
	}
	
	socket.on('afficheRes', function (data) {
		// On récupère le pseudo de celui qui a cliqué dans les variables de session
		console.log(' Réponse : recu ');
		var table = "<table><tr><th>Labels</th><th>Instances</th><th>Confidence</th><th>Parents</th></tr>";
		// show each face and build out estimated age table
		for (var i = 0; i < data.Labels.length; i++) {
			var instances = (data.Labels[i].Instances.length>0) ? data.Labels[i].Instances.length : 1;
			var parents = getParentsName(data.Labels[i].Parents);
			console.log(parents);
			table += '<tr><td><strong>' + data.Labels[i].Name +
			'</strong></td><td style="text-align:center">' + instances +
			'</td><td>' + data.Labels[i].Confidence +'</td><td style="text-align:center">'+ parents +'</td></tr>';
		}
		table += "</table>";
		document.getElementById("opResult").innerHTML = table;
		console.log(JSON.stringify(data));
	});
		
	document.getElementById("country").addEventListener("change", function (event) {
		var country = document.getElementById('country').value;
		console.log('country has changed');
		console.log(country);
		getRegion(country);
		$("#region").empty();
		$("#region").append("Region : " + region);
		
		$("#subregion").empty();
		$("#subregion").append("Subregion : " + subregion);
		$("#region").show();
		$("#subregion").show();
		//document.getElementById("inputCountry").value = country;
		
	}); 
	
	document.getElementById("infos").addEventListener("click", function (event) {
	//il faut vérifier la valeur des inputs
	// possible de voir la validité avec document.getElementById('your_input_id').validity.valid
		console.log('infos button has been clicked');
		var name = document.getElementById('name').value;
		var country = document.getElementById('country').value;
		var period = getPeriod();
		console.log(period);
		const infosuser = [{"country":country,"region":region,"subregion":subregion,"period":period}]; //in redis : name => name , ...
		console.log(country);
		console.log('infos have been loaded');
		console.log(infosuser);
		console.log(infosValid(name, country));
		//document.getElementById("periodTreemap").value = period;
		if (infosValid(name, country)){
			ProcessImage(country,period);		
		}
		else {
			showError(name, country);
		}
		
		//sendData();
	}, false);
	
	
	function infosValid(name, country){
		if (name == "" || country == "Choose State/Province"){
			return false;
		}
		else {
			return true;
		}
	}
	
	function showError(name, country){
		if (name == "" ){
			console.log('in show error');
			alert('Your name is incorrect, please try again');
		} else if (country == "Choose State/Province" ){
			alert('Your country is not defined, please try again');
		}
			
	}
	
	function getPeriod() {
		var radios = document.getElementsByName('period');

		for (var i = 0, length = radios.length; i < length; i++) {
			if (radios[i].checked) {
				return radios[i].value
			}
		}
	}
	
	function getRegion(country){
		$.ajax({ 
			    url: 'countries.json', 
			    dataType: 'json',
			    async: false, 
			    success: function(data){
					data.filter(
						function(data){
							if (data.key == country){
								callback(data.region,data.subregion);
							}
						} 
					)
			    
			}
		});
	}
	
	function callback(val,val2){
		region = val;
		subregion = val2;
	}
    
	function ProcessImage(country,period) {
		
		var control = document.getElementById("fileToUpload");
		var file = control.files[0];
		// Load base64 encoded image 
		var reader = new FileReader();
		reader.onload = (function (theFile) {
			return function (e) {
				var img = document.createElement('img');
				var image = null;
				img.src = e.target.result;
				var jpg = true;
				try {
					image = atob(e.target.result.split("data:image/jpeg;base64,")[1]);

				} catch (e) {
					jpg = false;
				}
				if (jpg == false) {
					try {
						image = atob(e.target.result.split("data:image/png;base64,")[1]);
					} catch (e) {
						alert("Not an image file Rekognition can process");
						return;
					}
				}
				//unencode image bytes for Rekognition DetectFaces API 
				var length = image.length;
				imageBytes = new ArrayBuffer(length);
				var ua = new Uint8Array(imageBytes);
				for (var i = 0; i < length; i++) {
					ua[i] = image.charCodeAt(i);
				}  
				console.log('image processed');
				socket.emit('loadFile',imageBytes,country,period);
				//console.log('image processed');
				//return imageBytes;
			};
		})(file);
			reader.readAsDataURL(file);
	}
	
	//Call 
	console.log("La mise en place est finie. En attente d'événements...");
});
