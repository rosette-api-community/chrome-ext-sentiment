// Saves options to chrome.storage.sync.
function save_options() {
  var entryField = document.getElementById('user-key');
  chrome.storage.local.set({'rosetteKey': entryField.value}, function() {
    // Notify user settings were saved
    document.getElementById('save-message').style.visibility = "visible";
    document.getElementById('save-message').innerHTML = "Settings successfully updated.";
  });
}
// add above function to Save button
document.getElementById('save').addEventListener('click', save_options);