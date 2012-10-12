//用于存储从cookie获得的用户信息
tb = {}
//用于监视登录状态的定时器
var intervalIdForMonitorLogin = -1;
var grayColor = "#222";
var redColor = "#F00";

//查看是否已经领取今天的淘金币
function hasGetTodaysCoin(names){
	var day=new Date().toDateString();
	
	var stname=localStorage['tbname']?localStorage['tbname']:'';
	var stdate=localStorage['tbdate']?localStorage['tbdate']:'';
	var newCoin = localStorage['newCoin']?localStorage['newCoin']:'';
	
	//有一个为空则代表没有获得今天的淘金币
	if (stname=='undefined' || stdate=='undefined' || newCoin =='undefined'  ||
		stname=='' || stdate=='' || newCoin =='' 
	) 
	{
		return false;
	}
	
	if ( names==stname && day==stdate )
	{ 
		return true;
	}
	
	return false;
}

//将今天已经领取的信息存放到DB
function doGetTodaysCoinToDB(name,newCoin)
{
	var day=new Date().toDateString();
	localStorage['tbname'] = name;
	localStorage['tbdate'] = day;
	localStorage['newCoin'] = newCoin;
}

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

//开始领取淘金币
function doGetCoin(sendResponse){
	
	var info = tbLogin.getLoginedInfo();
	
    ajax('http://taojinbi.taobao.com/home/grant_everyday_coin.htm?_tb_token_='+info.token,function(json,text){

        if (json.code=='1' || json.code == '2'){
			//成功获得今日淘金币
			db.setHasCurrentUserGot('true');
			db.setCurrentUserCoin(json.newCoin);
			db.setCurrentUserNick(info.tracknick);
			db.setCurrentUserGotDate(new Date().toDateString());
			
			setBadgeText(info.tracknick,json.coinNew,redColor);
			if(db.savedUserNick() == db.currentUserNick()){
				//当前登录的用户是保存用户
				db.setHasSavedUserGot('true');
			}
			
			console.log('成功领取今日淘金币');
			//发送给前台提示领取成功
			if(json.code == '1') sendResponse({result:"true",data:json});
        }
		else if(json.code == '4')
		{
			setBadgeText(tb.name,'N/A',grayColor);
			chrome.browserAction.setTitle({title: tb.name+ ' 还不能领取淘宝币，可能是好友不够'});
		}
		else if(!json.code)
		{
			console.log('json.code 为空，可能需要登录');
		}
    });
}

//获得淘金币
function getTaoBaoCoin(sendResponse)
{
	if(tbLogin.hasAnyoneLogined()){
		if(db.hasCurrentUserGot() == 'false'){
			doGetCoin(sendResponse);
		}
		else if(db.hasCurrentUserGot() == 'true' && db.currentUserGotDate() != new Date().toDateString())
		{
			//领过的同时，还需要判断是否是今天领取的
			doGetCoin(sendResponse);
		}
		else{
			console.log('今日已经领取过');
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
		}
		else
		{
			console.log('今日已经领取过');
		}
	}
}

function openTabForLogin()
{
	chrome.tabs.create({url:"https://login.taobao.com/member/login.jhtml?ref=itao",active:false});
}

function isTaoBaoLoginPage(url)
{
	if(url.indexOf('https://login.taobao.com') != 0 && url.indexOf('http://login.taobao.com') != 0)
	{
		return false;
	}
	
	return true;
}

function monitorLogin(id,sendResponse)
{
	console.log("正在监视登录...");
	chrome.tabs.get(id,function(tab){
        if(typeof tab == 'undefined')
        {
            console.log('因为找不到指定的登录tab，所以监视登录定时器被取消');
            window.clearInterval(intervalIdForMonitorLogin);
            return;
        }

        if(!isTaoBaoLoginPage(tab.url))
        {
            //已经登录成功
            console.log("登录成功...");
            window.clearInterval(intervalIdForMonitorLogin);
            chrome.tabs.remove(id);
        }

	});
}


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
	if(typeof db.hasTipToShow() == 'undefined'){
		db.setHasTipToShow('false');
	}
	if(typeof db.tipToShowContent() == 'undefined'){
		db.setTipToShowContent('');
	}
	if(typeof db.autoFlushTip() == 'undefined'){
		db.setAutoFlushTip('true');
	}
}

//初始化
function init()
{
	initDB();
	var newCoin = localStorage['newCoin'];
	var name =localStorage['tbname'];
	if( newCoin!= 'undefined' && name != 'undefined')
	{
		if(hasGetTodaysCoin(name))
		{
			setBadgeText(name,newCoin,redColor);
		}
		else
		{
			setBadgeText(name,newCoin,grayColor);
		}
	}
	else
	{
		setBadgeText(name,'N/A',grayColor);
	}
}

init();
