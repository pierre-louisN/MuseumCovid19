var socket = io.connect('http://localhost:8080');
console.log("Ce programme JS vient d'être chargé");
$(document).ready(function()
{
	console.log("Le document est prêt");
	
		//dropdown list from json file
		let dropdown = $('#country');
		dropdown.empty();
		dropdown.append('<option selected="true" disabled>Choose State/Province</option>');
		dropdown.prop('selectedIndex', 0);
		// Populate dropdown with list of provinces
		$.getJSON('country.json', function (data) {
			$.each(data, function (key, entry) {
				dropdown.append($('<option></option>').attr('value', entry.abbreviation).text(entry.name));
			})
		});
        	
		socket.on('afficheRes', function (data) {
			// On récupère le pseudo de celui qui a cliqué dans les variables de session
			console.log(' Réponse : recu ');
			var table = "<table><tr><th>Labels</th><th>Confidence</th></tr>";
			// show each face and build out estimated age table
			for (var i = 0; i < data.Labels.length; i++) {
				table += '<tr><td>' + data.Labels[i].Name +
				'</td><td>' + data.Labels[i].Confidence + '</td></tr>';
			}
			table += "</table>";
			document.getElementById("opResult").innerHTML = table;
			console.log(JSON.stringify(data));
			}); 
		
		document.getElementById("infos").addEventListener("click", function (event) {
		//il faut vérifier la valeur des inputs
		// possible de voir la validité avec document.getElementById('your_input_id').validity.valid
			console.log('infos button has been clicked');
			var name = document.getElementById('name').value;
			var country = document.getElementById('country').value;
			var region = document.getElementById('region').value;
			var sub_region = document.getElementById('sub-region').value;
			var period = getPeriod();
			//console.log(period);
			const infos = ["name",name,"country",country,"region",region,"subregion",sub_region,"period",period]; //in redis : name => name , ...
			ProcessImage(infos);
			//sendData();
		}, false);
		
		/*document.getElementById("fileToUpload").addEventListener("change", function (event) {
			console.log('User has loaded an image');
			ProcessImage();
		}, false);*/
		
		function getPeriod() {
			var radios = document.getElementsByName('period');

			for (var i = 0, length = radios.length; i < length; i++) {
				if (radios[i].checked) {
					return radios[i].value
				}
			}
		}
		
	    
		function ProcessImage(infos) {
			
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
					socket.emit('loadFile',imageBytes,infos);
					//console.log('image processed');
					//return imageBytes;
				};
			})(file);
				reader.readAsDataURL(file);
		}
		
        //Call 
	console.log("La mise en place est finie. En attente d'événements...");
});
