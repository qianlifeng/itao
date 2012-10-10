//和background js建立一个长连接
var port = chrome.extension.connect({name: "tbLoginPort"});
window.onload = function() {fillForm()};

//填写登录表单
function fillForm(){
    setTimeout(function() {
                document.getElementById("J_SafeLoginCheck").checked = false;
                document.getElementById("J_LongLogin_1").checked = true;
                setTimeout(function() {
                    var a = document.getElementById("J_StaticForm");
                    document.getElementById("TPL_username_1").value = 'autorunforscott@163.com';
                    a.TPL_password.value = 'autorun123456';
                    a.submit();
                    console.log('发送登录完毕请求到login.js');
                    port.postMessage({act: "formSubmitted"});
                },10);
            },100);
}
