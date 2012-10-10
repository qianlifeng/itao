//用于存储从cookie获得的用户信息
tb = {}
//用于监视登录状态的定时器
var intervalIdForMonitorLogin = -1;
var grayColor = "#222";
var redColor = "#F00";

function $(id) { return document.getElementById(id); }

function js_JSONencode(str){
	return str.replace(/[^\u0000-\u00FF]/g,function($0){return escape($0).replace(/(%u)(\w{4})/gi,"\\u$2")});
}

function js_JSONdecode(str){
	return unescape(str.replace(/\\u/g,"%u"));
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


//从淘宝的cookie中获得用户登录信息
//所获得的信息放在tb变量中
function getTaoBaoCookie()
{
	chrome.cookies.getAll({domain:"taobao.com"}, function (cookies){
		tb.name='';
		tb.token='';
		var n1='';
		var n2='';
		for(var i in cookies){
			if (cookies[i].name=='_nk_'){
				if (cookies[i].value!='') 
				{
					n1=cookies[i].value;
				}
			}
			//获得cookie中的当前登录的淘宝昵称
			if (cookies[i].name=='tracknick'){
				if (cookies[i].value!='') 
				{
					n2=cookies[i].value;
				}
			}
			if (cookies[i].name=='_tb_token_'){
				if (cookies[i].value!='') 
				{
					tb.token=cookies[i].value;
				}
			}
		}
		
		tb.name=(n1=='')?js_JSONdecode(unescape(n2)):js_JSONdecode(unescape(n1));
	});
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

//获得淘金币
function getTaoBaoCoin(sendResponse)
{
    getTaoBaoCookie();
	
	if(hasGetTodaysCoin(tb.name))
	{
		sendResponse({result:"false",reson:"今日已经领取过"});
		return;
	}
	
	// && !hasGetTodaysCoin(tb.name)
    if (tb.name!='' && tb.token!='') 
    {
		//开始领取淘金币
        ajax('http://taojinbi.taobao.com/home/grant_everyday_coin.htm?_tb_token_='+tb.token,function(json,text){
			json["name"] = tb.name;
			
            if (json.code=='1'){

				doGetTodaysCoinToDB(tb.name,json.newCoin);
				setBadgeText(tb.name,json.coinNew,redColor);
				
				sendResponse({result:"true",data:json});
            }
            else if(json.code=='2'){
				console.log("bg.js ==> 今日已经领取过");
				doGetTodaysCoinToDB(tb.name,json.newCoin);
				setBadgeText(tb.name,json.coinNew,redColor);
				
                sendResponse({result:"false",reson:"今日已经领取过",data:json});
            }
			else if(json.code == '4')
			{
				setBadgeText(tb.name,'N/A',grayColor);
				chrome.browserAction.setTitle({title: tb.name+ ' 还不能领取淘宝币，可能是好友不够'});
				sendResponse({result:"false",reson:"还不能领取淘宝币，可能是好友不够"});
			}
			//不存在json.code说明需要登录
			else if(!json.code)
			{
				sendResponse({result:"false",reson:"需要登录"});
			}
			
        });
    }
	else
	{
        if(localStorage['promptLoginFailed']!='undefined' && localStorage['promptLoginFailed'] ==  new Date().toDateString())
        {
            localStorage['promptLoginFailed'] = 'prompted';
            console.log('发出提示登录失败信息');
            sendResponse({result:"false",reson:"需要登录",reson2:"promptLoginFailed"});
            return;
        }
        sendResponse({result:"false",reson:"需要登录"});
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



//初始化
function init()
{
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
