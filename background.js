var regStrip = /^[\r\t\f\v ]+|[\r\t\f\v ]+$/gm;  // regular expression to eliminate whitechars

var defaults = {
	isBlacklist: true,
	isPartial: true,
	blacklist: 'Bilateral relations\nartist'.replace(regStrip, '')
}

chrome.commands.onCommand.addListener(function(command) {
  if (command === "open_website") {
    openRandomWiki();
  }
});

chrome.storage.onChanged.addListener((changes, namespace) => {
  for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
    console.log(
      `Storage key "${key}" in namespace "${namespace}" changed.`,
      `Old value was "${oldValue}", new value is "${newValue}".`
    );
	defaults[key] = newValue;
  }
});

async function openRandomWiki() {
	
	const [title, description, url] = await generateRandomWiki();

	if(isGoodDescription(description)) {
		console.log("good description: ", description);
		open_website(url);
	} else {
		console.log("bad description: ", description);
		openRandomWiki();  // try again
	}
}

async function generateRandomWiki() {
	
	var url = "https://en.wikipedia.org/w/api.php"; 
	var params = {
		action: "query",
		format: "json",
		generator: "random",
		grnnamespace: "0",  // taking the main page
		prop: "info|description",
		inprop: "url"
	};

	url = url + "?origin=*";
	Object.keys(params).forEach(function(key){url += "&" + key + "=" + params[key];});

	const response = await fetch(url);
	const jsonData = await response.json();
	
	for (const [id, page] of Object.entries(jsonData.query.pages)) {
		return [page.title, 
				page.description,
				page.canonicalurl];
	}
}


function isGoodDescription(urlDesc) {
	// Check if the description meets my criteria
	// TODO: Create vars to represent the value, and events to change their value
	
	var filterFunc = getFilterFunc(defaults["isPartial"]);
	
	var descs = defaults["blacklist"].split(/\n/).filter(Boolean);
	
	if (descs.some(descInList => urlDesc && filterFunc(descInList, urlDesc))) {
		return defaults["isBlacklist"] ? false : true;
	}
	return defaults["isBlacklist"] ? true : false;
}

function getFilterFunc(isPartial) {
	if (isPartial) {
		return (descInList, urlDesc) => urlDesc.includes(descInList);
	}
	else {
		return (descInList, urlDesc) => descInList == urlDesc;
	}
}

function open_website(wikiUrl) {
	chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      var currentTab = tabs[0];
      if (currentTab && currentTab.url.includes("wikipedia.org")) {
        chrome.tabs.update(currentTab.id, { url: wikiUrl });
      } else {
        chrome.tabs.create({ url: wikiUrl });
      }
    });
}
