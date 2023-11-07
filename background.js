var regStrip = /^[\r\t\f\v ]+|[\r\t\f\v ]+$/gm;  // regular expression to eliminate whitechars

var defaults = {
	langPrefix: 'he',
	isBlacklist: true,
	isPartial: true,
	blacklist: `\u05D9\u05D7\u05E1\u05D9 \u05D7\u05D5\u05E5
				\u05E9\u05D7\u05E7\u05DF
				\u05E9\u05D7\u05E7\u05E0\u05D9\u05EA`.replace(regStrip, ''),
	good_pages: []
}

const SIM_THRESHOLD = 0.75;

const API_TOKEN = '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'

// restore data in the first time, and fill pages 
restore_options()
	.then(() => {
		// alert(`good_pages has ${defaults['good_pages'].length} values`);
		  
		if (defaults['good_pages'].length < 5) {
		  load_pages()
	    }
  });
  
// add a listener for each change in the future
chrome.storage.onChanged.addListener((changes, namespace) => {
  for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
    console.log(
      `Storage key "${key}" in namespace "${namespace}" changed.`,
      `Old value was "${oldValue}", new value is "${newValue}".`
    );
	defaults[key] = newValue;
  }
});

chrome.commands.onCommand.addListener(function(command) {
  if (command === "open_website") {
    openRandomWiki();
  }
});
/*
if (defaults['good_pages'].length < 5) {
	alert(`good_pages has ${defaults['good_pages'].length} values, loads more`);
    load_pages();
}
*/

async function load_pages() {
	
	//finds lots of potential pages
	const pages = await generateRandomWikis();
	var descriptions = pages.map(page => page[1]);
	descriptions = descriptions.map((item) => (typeof item === "undefined" ? "undefined" : item));
	
	// creating a filter
	let is_descs_fit;
	if (defaults["isPartial"]) {
	  is_descs_fit = await is_meaning_matches(descriptions);
	} else {
	  is_descs_fit = is_exact_matches(descriptions);
	}
	
	// filtering and saving
	defaults['good_pages'].push(...pages.filter((page, index) => defaults['isBlacklist'] ^ is_descs_fit[index]));
	chrome.storage.sync.set(defaults, function() {
		if (chrome.runtime.lastError) {
		  console.error("Error saving data to Chrome storage:", chrome.runtime.lastError);
		} else {
		  console.log("good_pages saved to Chrome storage.");
		}
	});
	  
	if (defaults['good_pages'].length < 5) {
		console.log("too few pages were loaded, adding more");
		load_pages()
	}
}

async function huggingface_query(data) {
  const response = await fetch(
    "https://api-inference.huggingface.co/models/sentence-transformers/distiluse-base-multilingual-cased-v2",
    {																						
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json', // Specify the content type
      },
      body: JSON.stringify(data),
    }
  );
  if (response.ok) {
    const result = await response.json();
    return result;
  } else {
    throw new Error(`HTTP Error: ${response.status}`);
  }
}

async function is_meaning_matches(descriptions) {
	
	var sim_to_blacklist = new Array(descriptions.length).fill(false);
	
	var blacklist_vars = defaults["blacklist"].split(/\n/).filter(Boolean);
	
	for (const l_source_sentence of blacklist_vars) {
		
		try {
			const response = await huggingface_query({
			  inputs: {
				source_sentence: l_source_sentence,
				sentences: descriptions
			  }
			});

			if (Array.isArray(response)) {
			  const floatArray = response;
			  const boolArray = floatArray.map(sim => sim >= SIM_THRESHOLD);
			  
			  for (let i = 0; i < sim_to_blacklist.length; i++) {
				sim_to_blacklist[i] = sim_to_blacklist[i] || boolArray[i];
			  }
			} else {
			  console.error("Response does not contain a valid array of floats.");
			}
		} catch (error) {
			console.error(error);
		}
	}
	return sim_to_blacklist;
}

function is_exact_matches(descriptions) {
	var sim_to_blacklist = new Array(descriptions.length).fill(false);
	
	for (let i = 0; i<descriptions.length; i++) {
		for (const l_source_sentence of defaults['blacklist']) {
			if (l_source_sentence === descriptions[i]) {
				sim_to_blacklist[i] = true;
			}
		}
	}
	return sim_to_blacklist;
}


/*
// Function to be executed after 5 seconds
function delayedFunction() {
  console.log("This function is executed after 5 seconds.");
  
  // load 'good' wiki pages to be used immediately
  alert(`good_pages with len ${defaults['good_pages'].length}`);
  if (defaults['good_pages'].length < 5) {
    load_pages()
  }
}
// Set a 5-second delay
setTimeout(delayedFunction, 2000); // 5000 milliseconds (5 seconds)
*/

function openRandomWiki() {
		
	if (defaults['good_pages'].length > 0)
	{
		var [title, description, url] = defaults['good_pages'].pop();
		open_website(url);
		
		// saves the updated 'good_pages'
		chrome.storage.sync.set(defaults, function() {
			if (chrome.runtime.lastError) {
			  console.error("Error saving data to Chrome storage:", chrome.runtime.lastError);
			} else {
			  console.log("good_pages saved to Chrome storage.");
			}
		});
	}
	else
		console.log("'good_pages' is empty!");
	
	if (defaults['good_pages'].length < 5) {
		console.log("'good_pages' has only ${good_pages.length} values, load more pages");
		load_pages()
	}
}

async function generateRandomWikis() {
	
	var url = `https://${defaults['langPrefix']}.wikipedia.org/w/api.php`; 
	
	var params = {
		action: "query",
		format: "json",
		generator: "random",
		grnnamespace: "0",  // taking the main page
		//grnlimit: (defaults["isBlacklist"] ? "2" : "10"), // taking many pages at once
		grnlimit: "10", // taking many pages at once
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

// Restores options from chrome.storage
async function restore_options() {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(defaults, (storage) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        defaults["langPrefix"] = storage.langPrefix;
        defaults["isBlacklist"] = storage.isBlacklist;
        defaults["isPartial"] = storage.isPartial;
        defaults["blacklist"] = storage.blacklist;
        defaults["good_pages"] = storage.good_pages;
        resolve(defaults);
      }
    });
  });
}