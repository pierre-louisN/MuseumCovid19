var socket = io.connect('http://localhost:8080');
console.log("Ce programme JS vient d'être chargé");
$(document).ready(function()
{
	
	socket.emit('test');
	
	socket.on('response', function(resp){
		console.log('ici');
		console.log(resp);
		if (resp){
			if (typeof favDialog.showModal === "function") {
				favDialog.showModal();

			} else {
				console.error("L'API dialog n'est pas prise en charge par votre navigateur");
			}
		}

	});
	
	
	
	var confirmBtn = document.getElementById('confirmBtn');
	var changeBtn = document.getElementById('changeLanguage');
	
	confirmBtn.addEventListener('click', function (e) {
		lang = google.translate.TranslateElement().c;
		//console.log(readCookie('googtrans'));
		console.log(lang);
		document.getElementById("linkHome").href += "#googtrans/en/"+lang;
		document.getElementById("linkMuseum").href += "#googtrans/en/"+lang;
		document.getElementById("linkMaps").href += "#googtrans/en/"+lang;
		favDialog.close();
	});
	
	changeBtn.addEventListener('click', function (e) {
		favDialog.showModal();
		console.log(document.getElementById("lientest").href);
	});
	
	
	
	
	/*
	function readCookie(name) {
	var c = document.cookie.split('; '),
	cookies = {}, i, C;

	for (i = c.length - 1; i >= 0; i--) {
	C = c[i].split('=');
	cookies[C[0]] = C[1];
	}

	return cookies[name];
	}
	*/

console.log("La mise en place est finie. En attente d'événements...");
});
