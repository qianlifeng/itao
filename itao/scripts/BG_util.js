function $(id) { return document.getElementById(id); }

function js_JSONencode(str){
	return str.replace(/[^\u0000-\u00FF]/g,function($0){return escape($0).replace(/(%u)(\w{4})/gi,"\\u$2")});
}

function js_JSONdecode(str){
	return unescape(str.replace(/\\u/g,"%u"));
}

//发送消息到正在浏览的网页
function sendMessageToCurrentTab(msg){
	chrome.tabs.query({active:true,currentWindow:true},function(tabs){
		if(tabs.length > 0){
			chrome.tabs.sendMessage(tabs[0].id,{act:"showMessage",msg:msg});
		}
		else{
			console.log('没有找到当前打开的tab用于显示信息:'+msg);
		}
	});
}

function ajax(url,callback){
	var xmlHttp;
	xmlHttp = new XMLHttpRequest();
	xmlHttp.onreadystatechange = function() {  
        if (xmlHttp.readyState == 4) { 
         	if (xmlHttp.status == 200){
       			if (xmlHttp.responseText.trim().substr(0,1) == '{'){
       				var result = eval('(' + xmlHttp.responseText + ')');  
          			callback(result,xmlHttp.responseText);
       			}
                else{
				    callback(xmlHttp.responseText,xmlHttp.responseText); 
			    }
       		}
        }
    };
  
    xmlHttp.open("GET", url, true);//第三个参数为true为异步方式  
    xmlHttp.send(null);
}
