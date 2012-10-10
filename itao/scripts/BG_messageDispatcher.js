//分发来自前台的所有消息

//long-lived message 监听
chrome.extension.onConnect.addListener(function(port) {
  if(port.name == "tbLoginPort"){
      //监听来自cs_login.js的消息
      port.onMessage.addListener(function(msg) {
        tbLogin.getInstance().port = port;
        if (msg.act == "formSubmitted"){
            console.log('login.js收到登录完毕请求');
            setTimeout(tbLogin.getInstance().checkLoginSucceed,2000);
        }
        else if(msg.act == 'getUserForLogin')
        {
            port.postMessage({act: "startFillForm",user:localStorage['autoLoginUser'],pwd:localStorage['autoLoginPwd']});
        }
    });
  }
});

//short message message 监听
chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {   
	console.log("bg.js ==> 得到 "+request.act+" 请求");
    
	if (request.act == "getCoin"){
		getTaoBaoCoin(sendResponse);
	}
	else if(request.act == "tryLogin")
	{
        tbLogin.getInstance().login();
	}
	else if(request.act == "logout")
	{
		tbLogin.getInstance().logout();
	}
	
	//因为使用了异步ajax，所以这里要返回true表明了要等待异步发送给sender
	return true;
});