document.addEventListener('DOMContentLoaded', function() {
	var generateButton = document.getElementById('random');
	generateButton.addEventListener('click', function() {
		// TODO: activate "openRandomWiki()" from background.js
		chrome.tabs.getSelected(null, function(tab) {
			alert("Hello..! It's my extension.");
		});
	}, false);
	// TODO: add listener to "settings" button and open settings on chrome
}, false);