
var Api = require('rosette-api').Api;
var FACEBOOK_FB_TEXT_CLASS = "_5pbx userContent"; // css class name of fb text
var FACEBOOK_FB_OUTER_CLASS = "_4-u2" // css class name of outer container of fb text
var rosetteKey = null; // developer key with which to accesse Rosette API
var requests = []; // XMLHttpRequest queue

// given a sentiment score (from -.5 to .5), return an html color representing that sentiment
var sentimentColor = function(sentiment) {
	var color = '';
	if (sentiment < -0.5) { // dark red
		color = '#d07e7e';
    }
	else if (sentiment < -0.3) { // medium red
		color = '#eec1c1';
	}
	else if (sentiment < -0.1) { // light red
		color = '#e7c3c3';
	}
	else if (sentiment < 0.01) { // grey
		color = '#F8F8F8';
    }
    else if (sentiment < 0.1) { // light green
		color = '#cfe7be';
    }
	else if (sentiment < 0.3) { // medium green
		color = '#DEEED4';
	}
	else { // dark green
		color = '#ACD093';
    }
	return color;
};

// given a sentiment response from the Rosette API and a text container, 
// set the outer container's background color according to its
// calculated sentiment
function getSentimentAndColor(resp, container) {
    var pos = 0;
    var neg = 0;
    // necessary becuase response returns positive and negative confidence
    // in a different order depending on dominant sentiment (positive or negative)
    if (resp.document.label == "pos") {
        pos = resp.document.confidence;
    } else if (resp.document.label == "neg") {
        neg = resp.document.confidence;
    }

    var posVal = parseFloat(pos);
    var negVal = parseFloat(neg);

    getFBOuterContainer(container).style.backgroundColor = sentimentColor(posVal-negVal);
}

// given some text, return a rating from -2 to 2 representing the sentiment
var setBackgroundColor = function(text, container) {
    chrome.storage.local.get('rosetteKey', function (result) {
        if (result.rosetteKey != null) {
        var apiSent = new Api(result.rosetteKey, 'https://api.rosette.com/rest/v1/');
        var endpoint = "sentiment";
        apiSent.parameters.content = JSON.stringify(text);
        apiSent.parameters.language = "eng";

        apiSent.rosette(endpoint, function(err, res){
          if(err){
            console.log(err);
          } else {
            getSentimentAndColor(res, container);
          }
        });
        }
    });
    
};

// returns true if element has class cls
var hasClass = function(element, cls) {
    return (' ' + element.className + ' ').indexOf(' ' + cls + ' ') > -1;
};

// given a fb element, return the container element
// (for text analysis)
var getFBContainer = function(fb) {
	var container = fb;
	if(fb.parentNode) {
		container = fb.parentNode;
	}
	return container;
};

// given a facebook element, return the outer container
// (for pretty coloring)
var getFBOuterContainer = function(fb) {
    if (hasClass(fb, FACEBOOK_FB_OUTER_CLASS)) {
        return fb;
    } else {
        return getFBOuterContainer(fb.parentNode);
    }
}

// main function for filling in the colors corresponding to different sentiments on a facebook page
var fillSentiment = function() {
    var fbs = document.getElementsByClassName(FACEBOOK_FB_TEXT_CLASS);
	
    // first make sure there are new entries to analyze
    var newEntries = false;
    for (var i in fbs) {
        var fb = fbs[i];
        if(!fb.getAttribute || fb.getAttribute("rosette")) {
            continue;
        }
        newEntries = true;
        break;
    }
    if (!newEntries)
        return;
	
    for (var i in fbs) {
        var fb = fbs[i];
        if(!fb.getAttribute || fb.getAttribute("rosette")) {
            continue;
        } else {
            if(!fb.firstElementChild.innerText) {
                continue;
            }
        }
        fb.setAttribute("rosette", "1");
        // analyze new entries
        var text = fb.firstElementChild.innerText;
        var container = getFBContainer(fb);
        setBackgroundColor(text, container);
    }
};

//listen for when DOM is changed by AJAX calls
var react = function(evt) {
    // don't run right away. Rather wait a second so requests get batch sent
    setTimeout(function() {
        fillSentiment();
    }, 1000);
}
document.addEventListener("DOMNodeInserted", react);

// reload page when facebook checkbox is unchecked
chrome.storage.onChanged.addListener(function (changes, areaName) {
    if (changes.siteSelectors && changes.siteSelectors.newValue.indexOf("fsa") === -1) {
        document.removeEventListener("DOMNodeInserted", react);
        location.reload();
    }
});

// NOTE: This file contains the most elegant
// structure for sending non-concurrent XMLHttpRequests (to avoid 429 errors)
// out of all the Chrome extension examples.
