chrome.commands.onCommand.addListener(function(command) {
  if (command === "open_website") {
    openRandomWiki();
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


function isGoodDescription(description) {
  // Check if the description meets my criteria
  // TODO: Modify this function.
  return !description || /^[a-j]/i.test(description);
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
