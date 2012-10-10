//和background js建立一个长连接
var port = chrome.extension.connect({name: "tbLoginPort"});

//向后台发送消息获得用户信息用于登录
port.postMessage({act: "getUserForLogin"});
port.onMessage.addListener(function(msg) {
    if (msg.act == "startFillForm"){
        fillForm(msg.user,msg.pwd);
	}
});
	
//填写登录表单
function fillForm(user,pwd){
    setTimeout(function() {
                document.getElementById("J_SafeLoginCheck").checked = false;
                document.getElementById("J_LongLogin_1").checked = true;
                setTimeout(function() {
                    var a = document.getElementById("J_StaticForm");
                    document.getElementById("TPL_username_1").value = user;
                    a.TPL_password.value = pwd;
                    a.submit();
                    port.postMessage({act: "formSubmitted"});
                },10);
            },100);
}
