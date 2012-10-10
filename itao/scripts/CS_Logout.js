alert('logout');


chrome.extension.sendMessage({act: "logout"}, function(response) {
	
});
