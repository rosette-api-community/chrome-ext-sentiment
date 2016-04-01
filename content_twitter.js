
var TWITTER_TWEET_TEXT_CLASS = "tweet-text"; //css class name of tweet text
var TWITTER_TWEET_CONTAINER_CLASS = "tweet"; //css class name of tweet text container
var requests = [];

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

    container.style.backgroundColor = sentimentColor(posVal-negVal);
}

// given some text, return a rating from -2 to 2 representing the sentiment
var setBackgroundColor = function(text, container) {
    chrome.storage.local.get('rosetteKey', function (result) {
        if (result.rosetteKey != null) {
            var JSONtext = "{\"content\": " + JSON.stringify(text) + "}";
            var xmlhttp = new XMLHttpRequest();
            var url = "https://api.rosette.com/rest/v1/sentiment";

            xmlhttp.open("POST", url, true);
            xmlhttp.setRequestHeader ("X-RosetteAPI-Key", result.rosetteKey);
            xmlhttp.setRequestHeader ("Accept", "application/json");
            xmlhttp.setRequestHeader ("Content-Type", "application/json");
            xmlhttp.input = JSONtext;
            xmlhttp.onreadystatechange = function() {
                if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                    var JSONresponse= JSON.parse(xmlhttp.responseText);
                    getSentimentAndColor (JSONresponse, container);
                }
            }
            // Function that accesses requests queue when a request completes (regardless of whether the 
            // request returns an error or not), removes itself from top of queue, and sends next request.
            // This is necessary because Rosette API limits the number of requests that can be made concurrently.
            xmlhttp.onload = function() {
                if (requests.length > 1) {
                    requests.shift();
                    requests[0].send(requests[0].input);
                } else { // removes itself if it's the last one left in the queue
                    requests.shift();
                }
            }
            requests.push(xmlhttp);

            // send first request, which will trigger the rest through the onload method
            if (requests.length == 1) {
                    requests[0].send(requests[0].input);
                }
        }
    });
    
};

// returns true of element has class cls
var hasClass = function(element, cls) {
    return (' ' + element.className + ' ').indexOf(' ' + cls + ' ') > -1;
};

// given a tweet element, return the container element
var getTweetContainer = function(tweet) {
	var container = tweet;
	while(!hasClass(container, TWITTER_TWEET_CONTAINER_CLASS) && container.parentNode) {
		container = container.parentNode;
	}
	return container;
};

// main function for filling in the colors corresponding to different sentiments on a twitter page
var fillSentiment = function() {
    var tweets = document.getElementsByClassName(TWITTER_TWEET_TEXT_CLASS);
	
    // first make sure there are new entries to analyze
    var newEntries = false;
    for (var i in tweets) {
        var tweet = tweets[i];
        if(!tweet.getAttribute || tweet.getAttribute("rosette")) {
            continue;
        }
        newEntries = true;
        break;
    }
    if (!newEntries)
        return;
	
    for (var i in tweets) {
        var tweet = tweets[i];
        if(!tweet.getAttribute || tweet.getAttribute("rosette")) {
            continue;
        }
        tweet.setAttribute("rosette", "1");
		// analyze new entries
        var text = tweet.innerText;
        var container = getTweetContainer(tweet);
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
    if (changes.siteSelectors && changes.siteSelectors.newValue.indexOf("tsa") === -1) {
        document.removeEventListener("DOMNodeInserted", react);
        location.reload();
    }
});

// NOTE: The content_fb.js file in this repo contains the
// most elegant structure for sending non-concurrent XMLHttpRequests (to avoid 429 errors)
// out of all the Chrome extension examples.
