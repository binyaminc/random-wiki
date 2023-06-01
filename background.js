var regStrip = /^[\r\t\f\v ]+|[\r\t\f\v ]+$/gm;  // regular expression to eliminate whitechars

var defaults = {
	langPrefix: 'he',
	isBlacklist: true,
	isPartial: true,
	blacklist: `\u05D9\u05D7\u05E1\u05D9 \u05D7\u05D5\u05E5
				\u05E9\u05D7\u05E7\u05DF
				\u05E9\u05D7\u05E7\u05E0\u05D9\u05EA`.replace(regStrip, '')
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
	
	const pages = await generateRandomWikis();
	
	for (const page of pages) {
		var [title, description, url] = page;
		
		if(isGoodDescription(description)) {
			console.log("good description: ", description);
			open_website(url);
			return;
		} else {
			console.log("bad description: ", description);
		}
	}
	openRandomWiki();  // if none of the pages worked - try again
}

async function generateRandomWikis() {
	
	var url = `https://${defaults['langPrefix']}.wikipedia.org/w/api.php`; 
	
	var params = {
		action: "query",
		format: "json",
		generator: "random",
		grnnamespace: "0",  // taking the main page
		grnlimit: (defaults["isBlacklist"] ? "2" : "10"), // taking many pages at once
		prop: "info|description",
		inprop: "url"
	};

	url = url + "?origin=*";
	Object.keys(params).forEach(function(key){url += "&" + key + "=" + params[key];});

	const response = await fetch(url);
	const jsonData = await response.json();
	
	return Object.entries(jsonData.query.pages).map(getImportantData)
}

function getImportantData([id, page]) {
	return [page.title, page.description, page.canonicalurl]
}

function isGoodDescription(urlDesc) {
	// Check if the description meets my criteria
	
	var filterFunc = getFilterFunc(defaults["isPartial"]);
	var descs = defaults["blacklist"].split(/\n/).filter(Boolean);
	
	// if the description is in the black/white list
	if (descs.some(descInList => urlDesc && filterFunc(descInList, urlDesc))) {
		return defaults["isBlacklist"] ? false : true;
	}
	// if the description is not in the list
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
