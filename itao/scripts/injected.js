//此文件会被注入到当前浏览的页面中，便于和content script的通信
function trigger(jsonData, f_callback) {
    var d = document.createElement("textarea"),
        e = document.createEvent("Events");
    d.style.cssText = "display:none;";
    d.value = jsonData == null ? "" :JSON.stringify(jsonData);
    d.addEventListener("action", function() {
        f_callback && f_callback(d.value);
        d.parentNode.removeChild(d);
    }, true);
    document.body.appendChild(d);

    // Fire events, to notify the Content script
    e.initEvent("ITAO_triggerFromPage", false, true);
    d.dispatchEvent(e);
}

function stopTryLoginToday(){
	trigger({act:'stopTryLoginToday'},function(response){
		r = JSON.parse(response);
		if(typeof r.act != 'undefined'){
			if(r.act == 'closeTip'){
				document.getElementById('banner').style.display ='none';
			}
		}
	});
}