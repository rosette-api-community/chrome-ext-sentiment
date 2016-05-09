// initialize which checkboxes should be checked
chrome.storage.local.set({
	'siteSelectors': [ "tsa", "fsa" ]
});

// Update badge text to say on or off depending on what boxes are checked
function updateBadgeText() {
	chrome.storage.local.get('siteSelectors', function (result) {
		if (result.siteSelectors.length === 0) { // no boxes checked
	    	chrome.browserAction.setIcon({path:"images/Sentiment_OFF.png"});
	    	chrome.browserAction.setBadgeBackgroundColor({color:[190, 190, 190, 230]});
	    	chrome.browserAction.setBadgeText({text:"OFF"});
		} else { // one or two boxes checked
			chrome.browserAction.setIcon({path: "images/Sentiment_ON.png"});
		    chrome.browserAction.setBadgeBackgroundColor({color:[208, 0, 24, 255]});
		    chrome.browserAction.setBadgeText({text:"ON"});
		}
	});
}
// put above function into effect
chrome.storage.onChanged.addListener(function (changes, areaName) {
	updateBadgeText();
});
chrome.runtime.onStartup.addListener(updateBadgeText);
chrome.runtime.onInstalled.addListener(updateBadgeText);

// Runs content_fb.js and content_twitter.js at the appropriate times
function putSentiment(tab) {
	chrome.storage.local.get('siteSelectors', function (result) {
		if (result.siteSelectors.indexOf("tsa") > -1) { // when twitter box is checked
			chrome.tabs.query({"url": "*://*.twitter.com/*", "active": true}, function (queryResult) {
				if ((queryResult.length > 0) && (queryResult[0].status === "complete")) { // after page finishes loading
					chrome.tabs.executeScript(queryResult[0].id, {file: "bundle.js"});
				}
			});
		}

		if (result.siteSelectors.indexOf("fsa") > -1) { // when facebook box is checked
			chrome.tabs.query({"url": "*://*.facebook.com/*", "active": true}, function (queryResult) {
				if ((queryResult.length > 0) && (queryResult[0].status === "complete")) { // after page finishes loading
					chrome.tabs.executeScript(queryResult[0].id, {file: "bundle2.js"});
				}
			});
		}
	});
}
// put above function into effect
chrome.tabs.onCreated.addListener(putSentiment);
chrome.tabs.onUpdated.addListener(putSentiment);

// Start running content scripts immediately when boxes checked
chrome.storage.onChanged.addListener(function (changes, areaName) {
	if (changes.siteSelectors) {
		putSentiment();
	}
});