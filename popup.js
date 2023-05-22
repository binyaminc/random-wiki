document.addEventListener('DOMContentLoaded', function() {
	
	// When "Random" button is pressed - open random wiki
	document.querySelector("#random").addEventListener("click", 
		function () {
			openRandomWiki()
		});
	
	// When "Settings" button is pressed - open settings on chrome
	document.querySelector("#settings").addEventListener("click", 
		function () {
			window.open(chrome.runtime.getURL("settings.html"));
		});
}, false);