function $(id) { return document.getElementById(id); }

function js_JSONencode(str){
	return str.replace(/[^\u0000-\u00FF]/g,function($0){return escape($0).replace(/(%u)(\w{4})/gi,"\\u$2")});
}

function js_JSONdecode(str){
	return unescape(str.replace(/\\u/g,"%u"));
}

//有消息需要显示到前台
function showTipToContentScript(content,dontAutoFlush){
	db.setHasTipToShow('true');
	db.setTipToShowContent(content);
	
	var dotautoFlash=arguments[1]?arguments[1]:false;
	if(dotautoFlash){
		db.setAutoFlushTip('false');
	}
	else{
		db.setAutoFlushTip('true');	
	}
}

function stopShowTipToContentScript(){
	db.setHasTipToShow('false');
	db.setTipToShowContent('');
	db.setAutoFlushTip('true');	
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
