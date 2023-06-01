var regStrip = /^[\r\t\f\v ]+|[\r\t\f\v ]+$/gm;  // regular expression to eliminate whitechars

var defaults = {
	langPrefix: 'he',
	isBlacklist: true,
	isPartial: true,
	blacklist: `\u05D9\u05D7\u05E1\u05D9 \u05D7\u05D5\u05E5
				\u05E9\u05D7\u05E7\u05DF
				\u05E9\u05D7\u05E7\u05E0\u05D9\u05EA`.replace(regStrip, '')
}

document.addEventListener("DOMContentLoaded", function () {

	initLangPrefix();
	restore_options();

	document.getElementById("save").addEventListener("click", save_options);
	
});

function initLangPrefix() {
	
	chrome.runtime.getPackageDirectoryEntry(function(root) {
		root.getFile('./options/languages.json', {}, function(fileEntry) {
			fileEntry.file(function(file) {
				var reader = new FileReader();
				reader.onloadend = function(e) {
					var langFile = JSON.parse(this.result);
					
					// take the keys (language names) of the file
					const langs = Object.keys(langFile);
					
					const select = document.getElementById("langPrefix"); 
					
					// for each language, add option in the 'select' tag
					langs.forEach((lang, index) => {
						let newOption = new Option(lang, langFile[lang]);
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
	var langPrefix = document.getElementById("langPrefix").value;
	var isBlacklist = document.getElementById("isBlacklist").checked;
	var isPartial = document.getElementById("isPartial").checked;
	var blacklist = document.getElementById("blacklist").value;
	
	chrome.storage.sync.set(
	{
		langPrefix: langPrefix,
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
	
	document.getElementById("langPrefix").value = storage.langPrefix;
    document.getElementById("isBlacklist").checked = storage.isBlacklist;
    document.getElementById("isPartial").checked = storage.isPartial;
	document.getElementById("blacklist").value = storage.blacklist;
  });
}

