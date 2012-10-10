function $(id) { return document.getElementById(id); }

function showtip(info){
	var tjb=parseInt(info.coinNew)-parseInt(info.coinOld);
	var tomorrow = info.coinTomorrow;

	var htmls='';

	htmls+='<div class="banner" id="banner">';
    
    htmls+='    <div class="t_right">';
    
    htmls+='        <button class="btnOk" onclick="document.getElementById(\'banner\').style.display =\'none\'" >我知道了...</button>';
    
	htmls+='    </div>';

    htmls+='    <div class="t_center">';

	htmls+='	    <span class="t_span">亲，已经为<span class="t_strong">'+info.name+'</span>成功领取了<span class="t_strong">'+tjb+'</span>淘金币哦';

	htmls+='    </div>';



    htmls+='</div>';
	
	var domobj=document.createElement("div");
	domobj.innerHTML =htmls;
	document.getElementsByTagName("body").item(0).insertBefore(domobj,document.getElementsByTagName("body").item(0).childNodes[0]);
}

function showTextTip(){
	var htmls='';

	htmls+='<div class="banner" id="banner">';
    
    htmls+='    <div class="t_right">';
    
    htmls+='        <button class="btnOk" onclick="document.getElementById(\'banner\').style.display =\'none\'" >我知道了...</button>';
    
	htmls+='    </div>';

    htmls+='    <div class="t_center">';

	htmls+='	    <span class="t_span">亲，自动领取淘金币失败了，需要您登录淘宝后才能继续领取。<span class="t_strong"><a href="http://login.taobao.com/" target="_blank">登录一下</a></span>？</span>';

	htmls+='    </div>';



    htmls+='</div>';
	
	var domobj=document.createElement("div");
	domobj.innerHTML =htmls;
	document.getElementsByTagName("body").item(0).insertBefore(domobj,document.getElementsByTagName("body").item(0).childNodes[0]);
}

chrome.extension.sendMessage({act: "getCoin"}, function(response) {
	if(response.reson)
	{
		console.log("getCoin.js ==> 从bg.js获得反馈，反馈结果："+response.reson);
    }
	else
	{
		console.log("getCoin.js ==> 从bg.js获得反馈");
	}

    if(response.reson2)
    {
        showTextTip()
    }
	
	
	if(response.result == "true")
	{
		showtip(response.data);
	}
	else
	{
        if(response.data)
        {
			//今日已经领取
		    //showtip(response.data);
        }
        if(response.reson == "需要登录")
		{
			chrome.extension.sendMessage({act: "tryLogin"});
		}
        
	}
});

