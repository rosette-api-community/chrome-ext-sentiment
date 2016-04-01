// Returns a list of the values of the checked checkboxes
function readCheckboxes() {
    var selectors = document.getElementById("site-selector").elements;
    var selected = [];
    for (var i = 0; i < selectors.length; i++) {
        if (selectors[i].checked) {
            selected.push(selectors[i].value);
        }
    }
    return selected;
}

// Save list of checked checkboxes in local storage
function cacheCheckboxes() {
    chrome.storage.local.set({'siteSelectors': readCheckboxes()});
}

document.addEventListener('DOMContentLoaded', function() {

  // Check the boxes that were checked last time; otherwise, check all the boxes
  chrome.storage.local.get('siteSelectors', function (result) {
    var boxes = document.getElementById("site-selector").elements;
    if (result['siteSelectors'] == null) {
      for (var i = 0; i < boxes.length; i++) {
        boxes[i].checked = true;
      }
    } else {
      for (var i = 0; i < boxes.length; i++) {
        if (result['siteSelectors'].indexOf(boxes[i].value) > -1) {
          boxes[i].checked = true;
        }
      }
    }
  });

  // Tell checkboxes to cache themselves when clicked
  document.getElementById("site-selector").addEventListener("click", cacheCheckboxes);
});
