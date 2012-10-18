var grayColor = "#222";
var redColor = "#F00";

//color:可以是css样式的颜色，例如：#eeeeee
function setBadgeText(name,newCoin,colors)
{
    if(typeof newCoin == 'undefined') return;

	chrome.browserAction.setBadgeText({ text: newCoin.toString() });
	if(colors == grayColor)
	{
		chrome.browserAction.setTitle({title: name +" 的淘金币数：今日还没有领取"});
	}
	else
	{
		chrome.browserAction.setTitle({title: name +" 的淘金币数："+newCoin});
	}
	chrome.browserAction.setBadgeBackgroundColor({color:colors});
}

/**
 * 从cookie中获取url
 * @param {Object} cookie
 */
function GetUrlFromCookie(cookie){
    return "http" + (cookie.secure ? "s" : "") + "://" + cookie.domain + cookie.path;
};

//开始领取淘金币
function doGetCoin(){
	
	var info = tbLogin.getLoginedInfo();
	
    ajax('http://taojinbi.taobao.com/home/grant_everyday_coin.htm?_tb_token_='+info.token,function(json,text){

        if (json.code=='1' || json.code == '2'){
			//成功获得今日淘金币
			db.setHasCurrentUserGot('true');
			db.setCurrentUserCoin(json.coinNew);
			db.setCurrentUserNick(info.tracknick);
			db.setCurrentUserGotDate(new Date().toDateString());
			
			setBadgeText(info.tracknick,json.coinNew,redColor);
			if(db.savedUserNick() == db.currentUserNick()){
				//当前登录的用户是保存用户
				db.setHasSavedUserGot('true');
			}
			
			//发送给前台提示领取成功
			if(json.code == '1') {
				console.log('成功领取今日淘金币');
				var coinGet = json.coinNew - json.coinOld;
				sendMessageToCurrentTab({msgType:'getCoinSucceed',data:{user:info.tracknick,coin:coinGet}});
			}
			else{
				console.log('今日已经领取');
			}
        }
		else if(json.code == '4')
		{
			setBadgeText(info.tracknick,'N/A',grayColor);
			chrome.browserAction.setTitle({title: info.tracknick + ' 还不能领取淘宝币，可能是好友不够'});
		}
		else if(!json.code)
		{
			chrome.cookies.getAll({domain:"taobao.com"}, function (cookies){
				for(var i in cookies){
					if (cookies[i].name=='_tb_token_'){
						chrome.cookies.remove({url:GetUrlFromCookie(cookies[i]),name:cookies[i].name});
					}
				}
			});
			console.log('json.code 为空，可能需要登录');
		}
    });
}

//获得淘金币
function getTaoBaoCoin()
{
	if(tbLogin.hasAnyoneLogined()){
		if(db.hasCurrentUserGot() == 'false'){
			doGetCoin();
		}
		else if(db.hasCurrentUserGot() == 'true' && db.currentUserGotDate() != new Date().toDateString())
		{
			//领过的同时，还需要判断是否是今天领取的
			doGetCoin();
		}
		else{
			console.log('今日已经领取过...');
			//虽然在领取的时候会自动设置badge信息，但是有可能插件是被禁止又重新启用
			//这种情况下就应该设置badge，因为不会在去getCoin了
			setBadgeText(db.currentUserNick(),db.currentUserCoin(),redColor);
		}
	}
	else{
		if(db.savedUser() == ""){
			console.log('当前没有用户登录，也没有检测到自动登录信息...');
			return;
		}
		
		//同样的判断领过的同时，还需要判断是否是今天领取的
		if(db.hasSavedUserGot() == "false" || ( db.hasSavedUserGot() == 'true' && db.savedUserGotDate()!= new Date().toDateString() ))
		{
			if(db.dontTryLoginToday() !=  new Date().toDateString())
			{
				tbLogin.login();
			}
			else
			{
				console.log('用户设置今日不在尝试自动登陆');
			}
		}
		else
		{
			console.log('保存用户今日已经领取过');
		}
	}
}

//获得淘金币的详细信息
function getTaoJinBiDetail(sendResponse){
	if(tbLogin.hasAnyoneLogined()){
		var info = tbLogin.getLoginedInfo();
		ajax('http://taojinbi.taobao.com/record/my_coin_detail.htm?tracelog=Tcoin_detail?_tb_token_='+info.token,function(json,text){
			var reg = new  RegExp(/<td>(.*?)<\/td>\s*?<td>(.*)<\/td>\s*?<td>(.*)<\/td>/gi);
			var detailArray = [];
			
			var s = reg.exec(text);
			while(s != null){
				detailArray.push({desc:s[1],date:s[2],coin:s[3]});
				s = reg.exec(text);
			}
			
			sendResponse({act:'taojinbiDetail',data:detailArray});
		});
	}
}

//获得当前登录用户概况
function getCurrentUserInfoForPopup(sendResponse){
	if(tbLogin.hasAnyoneLogined()){
		sendResponse({act:'currentUserInfoForPopup',data:{user:db.currentUserNick(),coin:db.currentUserCoin()}});
	}
	else{
		sendResponse({act:'needLoginForPopup'});
	}
};

//浏览器重启或者插件重新安装的时候初始化数据库
function initDB(){
	if(typeof db.savedUser() == 'undefined'){
		db.setSavedUser('');
	}
	if(typeof db.savedUserPwd() == 'undefined'){
		db.setSavedUserPwd('');
	}
	if(typeof db.savedUserNick() == 'undefined'){
		db.setSavedUserNick('');
	}
	if(typeof db.currentUserNick() == 'undefined'){
		db.setCurrentUserNick('');
	}
	if(typeof db.currentUserCoin() == 'undefined'){
		db.setCurrentUserCoin('');
	}
	if(typeof db.prevUserNick() == 'undefined'){
		db.setPrevUserNick('');
	}
	if(typeof db.hasCurrentUserGot() == 'undefined'){
		db.setHasCurrentUserGot('false');
	}
	if(typeof db.hasSavedUserGot() == 'undefined'){
		db.setHasSavedUserGot('false');
	}
	if(typeof db.currentUserGotDate() == 'undefined'){
		db.setCurrentUserGotDate('');
	}
	if(typeof db.savedUserGotDate() == 'undefined'){
		db.setSavedUserGotDate('');
	}
	if(typeof db.dontTryLoginToday() == 'undefined'){
		db.setDontTryLoginToday('');
	}
}

//初始化
function init()
{
	initDB();
}

init();
