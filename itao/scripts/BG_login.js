//单例模式
var tbLogin = (function(){

    //当前用于登录的tab id
    var currentLoginTabId = '';
	var loginedInfoCache = {};

    //打开登录tab准备进行登录
    function openTabForLogin(){
	    chrome.tabs.create({url:"https://login.taobao.com/member/login.jhtml?ref=itao",active:false},function(tab){
            currentLoginTabId = tab.id;
        });
    }

    //判断指定的url是否是登录页面
    function isTaoBaoLoginPage(url){
        if(url.indexOf('https://login.taobao.com') != 0 && url.indexOf('http://login.taobao.com') != 0)
        {
            return false;
        }
        
        return true;
    }
	
	//是否已经登录到了淘宝
	function hasAnyoneLogined(){
		
		//有任何一个变量没定义则没有登录
		if(typeof loginedInfoCache.token == 'undefined' || typeof loginedInfoCache.tracknick == 'undefined'
		|| typeof loginedInfoCache == 'undefined'){
			return false;
		}
	
		if(loginedInfoCache.token != '' && loginedInfoCache.tracknick != ''){
			return true;
		}
		
		return false;
	}
	
	//每隔一段时间自动获得登录信息。因为cookie相关的API
	//都是异步的，与同步方法放在一起时候可能会获取不到值
	function getLoginedInfoTimer(){
		//通过一个临时变量
		var loginedInfoCacheTemp = {};
		
		chrome.cookies.getAll({domain:"taobao.com"}, function (cookies){
			for(var i in cookies){
				if (cookies[i].name=='_nk_'){
					if (cookies[i].value!='') 
					{
						loginedInfoCacheTemp.nk = js_JSONdecode(unescape(cookies[i].value));
					}
					else
					{
						loginedInfoCacheTemp.nk = '';
					}
				}
				else if (cookies[i].name=='tracknick'){
					if (cookies[i].value!='') 
					{
						loginedInfoCacheTemp.tracknick = js_JSONdecode(unescape(cookies[i].value));
					}
					else
					{
						loginedInfoCacheTemp.tracknick = '';
					}
				}
				else if (cookies[i].name=='_tb_token_'){
					if (cookies[i].value!='') 
					{
						loginedInfoCacheTemp.token=cookies[i].value;
					}
					else
					{
						loginedInfoCacheTemp.token = '';
					}
				}
			}
			
			loginedInfoCache = loginedInfoCacheTemp;
			loginedInfoCacheTemp = null;
		});
	}
	
    //判断打开的登录tab是否登录成功
    function handleLoginAfterSubmitted(){
		console.log('开始判断是否登录成功');	
		if(!hasAnyoneLogined()){
			//登录失败
            console.log('自动登陆失败');
			sendMessageToCurrentTab({msgType:'loginFailed'});
		}
		else
		{
			console.log('自动登陆成功');
			
			//重置 hasCurrentUserGot，否则会一直认为已经获取
			db.setHasCurrentUserGot('false');
			
			//一旦登录成功，肯定是保存用户登录成功
		}
		
		chrome.tabs.remove(currentLoginTabId);
		currentLoginTabId = '';
    }

    //是否正在登录
    function isProcessingLogin(){
       if(currentLoginTabId == '') return false;

       chrome.tabs.get(currentLoginTabId,function(tab){
            if(typeof tab == 'undefined')
            {
                console.log('找不到指定的登录tab，当前登录状态将被重置');
                currentLoginTabId = '';
                return false;
            }
       });

       return true;
    }

	
    return {
        login:function(){
            if(!isProcessingLogin()){
                //此操作会触发cs_login.js 的content脚本
                openTabForLogin();
            }
        },
		logout:function(){

			db.setHasCurrentUserGot('false');
			db.setCurrentUserCoin('N/A');
			db.setCurrentUserNick('');
			db.setCurrentUserGotDate('');
			
			chrome.browserAction.setBadgeText({ text: 'N/A' });
			chrome.browserAction.setBadgeBackgroundColor({color:'#222'});
			chrome.browserAction.setTitle({title:'还未登陆'});
		},
        handleLoginAfterSubmitted:function(){
            return handleLoginAfterSubmitted();                  
        },
		hasAnyoneLogined:function(){
			return hasAnyoneLogined();
		},
		getLoginedInfo:function(){
			return loginedInfoCache;
		},
		startGetCookieInfoTimer:function(){
			setInterval(getLoginedInfoTimer,1000);
		}
    };
})();

tbLogin.startGetCookieInfoTimer();
