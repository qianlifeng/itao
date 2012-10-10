//单例模式
var tbLogin = (function(){
    var instance;
    //当前用于登录的tab id
    var currentLoginTabId = null;
    //用于和前台cs_login进行长链接通信的端口
    var port = null;

    //打开登录tab准备进行登录
    function openTabForLogin(){
	    chrome.tabs.create({url:"https://login.taobao.com/member/login.jhtml?ref=itao",active:false},function(tab){
            currentLoginTabId = tab.id;
        });
    }

    //判断指定的url是否是登录页面
    function isTaoBaoLoginPage(url)
    {
        if(url.indexOf('https://login.taobao.com') != 0 && url.indexOf('http://login.taobao.com') != 0)
        {
            return false;
        }
        
        return true;
    }

    //判断打开的登录tab是否登录成功
    function checkLoginSucceed(){

        var loginSucceed = false;
            
        chrome.cookies.getAll({domain:"taobao.com"}, function (cookies){
            for(var i in cookies){
                if (cookies[i].name=='_tb_token_'){
                    if (cookies[i].value!='') 
                    {
                       loginSucceed = true;
                       break;
                    }
                }
            }
			
			if(!loginSucceed){
				//登录失败
                console.log('登陆失败，关闭登录窗口，今天不再尝试登录');
                localStorage['loginFailedDate'] = new Date().toDateString();
                localStorage['promptLoginFailed'] = new Date().toDateString();
                //chrome.tabs.remove(currentLoginTabId);
                currentLoginTabId = null;
                return false; 
			}
			else
			{
				chrome.tabs.remove(currentLoginTabId);
				currentLoginTabId = null;
				return true;
			}
        });
    }

    //是否正在登录
    function isProcessingLogin(){
       if(currentLoginTabId == null) return false;

       chrome.tabs.get(currentLoginTabId,function(tab){
            if(typeof tab == 'undefined')
            {
                console.log('找不到指定的登录tab，当前登录状态将被重置');
                currentLoginTabId = null;
                return false;
            }
       });

       return true;
    }

    function init(){
        return {
            //公开的方法和变量
            login:function(){
                //判断今天是否已经尝试登录，但是失败了。失败过一次后就不再尝试进行登录
                var hasTryToLoginButFailedToday = localStorage['loginFailedDate'];
                if(hasTryToLoginButFailedToday!='undefined' && hasTryToLoginButFailedToday == new Date().toDateString())
                {
                    console.log('今日已经尝试登录过，但是失败了。今日将不再尝试继续登录');
                    return;
                }

                if(!isProcessingLogin()){
                    //此操作会触发cs_login.js 的content脚本
                    openTabForLogin();
                }
            },
			logout:function(){
				chrome.browserAction.setBadgeText({ text: 'N/A' });
				chrome.browserAction.setBadgeBackgroundColor({color:'#222'});
				chrome.browserAction.setTitle({title:'还未登陆'});
			},
            checkLoginSucceed:function(){
                return checkLoginSucceed();                  
            },
            port:port
        };
    }

    return{
        getInstance:function(){
            if(!instance){
                instance = init();
            }
            return instance;
        }
    }
})();

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

