chrome.extension.sendMessage({act: "getCurrentUserInfoForPopup"},function(response){
	if(response.act == 'needLoginForPopup'){
		document.getElementById('needLogin').style.display = '';
	}
	else if(response.act == 'currentUserInfoForPopup'){
		document.getElementById('user').innerHTML = response.data.user;
		document.getElementById('coin').innerHTML = response.data.coin;
		document.getElementById('loadingImg').style.display = '';
		document.getElementById('userInfo').style.display = '';
		tryGetCoinDetail();
	}
});

function tryGetCoinDetail(){
	chrome.extension.sendMessage({act: "getTaoJinBiDetail"},function(response){
		if(response.act == 'taojinbiDetail'){
			if(response.data != null){
				var coinArray = response.data;
			
				var table = document.getElementById("coinDetail");
				table.innerHTML = '';	
				var htmlStr = '';
				for(var i = 0;i< coinArray.length;i++){
					htmlStr+='<tr><td>'+coinArray[i].coin+'</td><td>'+coinArray[i].desc+'</td><td>'+coinArray[i].date+'</td></tr>'
				}
				table.innerHTML = htmlStr;
				document.getElementById('loadingImg').style.display = 'none';
				document.getElementById('coinDetailTable').style.display = '';
			}
		}
	});
}