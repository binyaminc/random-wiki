var regStrip = /^[\r\t\f\v ]+|[\r\t\f\v ]+$/gm;  // regular expression to eliminate whitechars

var defaults = {
	isBlacklist: true,
	isPartial: true,
	blacklist: 'Bilateral relations\nartist'.replace(regStrip, '')
}

document.addEventListener("DOMContentLoaded", function () {

	initLanPrefix();
	restore_options();

	document.getElementById("save").addEventListener("click", save_options);
	
});

function initLanPrefix() {
	
	chrome.runtime.getPackageDirectoryEntry(function(root) {
		root.getFile('./languages.json', {}, function(fileEntry) {
			fileEntry.file(function(file) {
				var reader = new FileReader();
				reader.onloadend = function(e) {
					var myFile = JSON.parse(this.result);
					/*do here whatever with your JS object(s)*/
					const langs = Object.keys(myFile);
					const select = document.getElementById("lanPrefix"); 
					
					langs.forEach((lang, index) => {
						let newOption = new Option(lang, myFile[lang]);
						if (lang == "\u05e2\u05d1\u05e8\u05d9\u05ea")  // hebrew
							newOption.defaultSelected = true;
						
						select.add(newOption,undefined);
					});
				};
				reader.readAsText(file);
			});
		});
	});
}

// Saves options to chrome.storage
function save_options() {
	var isBlacklist = document.getElementById("isBlacklist").checked;
	var isPartial = document.getElementById("isPartial").checked;
	var blacklist = document.getElementById("blacklist").value;
	
	chrome.storage.sync.remove([
		"isBlacklist",
		"isPartial",
		"blacklist"
	]);
	chrome.storage.sync.set(
	{
		isBlacklist: isBlacklist,
		isPartial: isPartial,
		blacklist: blacklist.replace(regStrip, "")
	},
    function () {
      // Update status to let user know options were saved.
      var status = document.getElementById("status");
      status.textContent = "Options saved";
      setTimeout(function () {
        status.textContent = "";
      }, 1000);
    });
}

// Restores options from chrome.storage
function restore_options() {
  chrome.storage.sync.get(defaults, function (storage) {
    document.getElementById("isBlacklist").checked = storage.isBlacklist;
    document.getElementById("isPartial").checked = storage.isPartial;
	document.getElementById("blacklist").value = storage.blacklist;
  });
}

