//分发来自前台的所有消息

//long-lived message 监听
chrome.extension.onConnect.addListener(function(port) {
  if(port.name == "tbLoginPort"){
      //监听来自cs_login.js的消息
      port.onMessage.addListener(function(msg) {
        if (msg.act == "formSubmitted"){
            setTimeout(tbLogin.handleLoginAfterSubmitted,2000);
        }
        else if(msg.act == 'getUserForLogin')
        {
            port.postMessage({act: "startFillForm",user:db.savedUser(),pwd:db.savedUserPwd()});
        }
    });
  }
});

//short message message 监听
chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {   
	console.log("message ==> 得到 "+request.act+" 请求");
    
	if (request.act == "getCoin"){
		getTaoBaoCoin(sendResponse);
	}
	else if(request.act == "tryLogin"){
        tbLogin.getInstance().login();
	}
	else if(request.act == "logout"){
		tbLogin.getInstance().logout();
	}
	else if(request.act == 'hasTipToShow'){
		if(db.hasTipToShow() == 'true'){
			//一旦发送给前台显示消息后，清空消息
			sendResponse({tip:db.tipToShowContent()});
			
			if(db.autoFlushTip() == 'true'){
				stopShowTipToContentScript();
			}
		}
	}
	else if(request.act == 'dontPromptLoginToday'){
		stopShowTipToContentScript();
	}
	else if(request.act == 'hasMessageFromFrontPage'){
		msgFromPage(JSON.parse(request.data1),sendResponse);
	}
	
	//因为使用了异步ajax，所以这里要返回true表明了要等待异步发送给sender
	return true;
});

//来自用户前台页面的消息，不是content script页面
//jsonData来自injected.js里面的发送
function msgFromPage(jsonData,sendResponse){
	if(jsonData.act == 'stopTryLoginToday'){
		stopShowTipToContentScript();
		db.setDontTryLoginToday(new Date().toDateString());
		
		sendResponse({act:'closeTip'});
	}
}