function $(id) { return document.getElementById(id); }

function saveUser()
{
    var name = $('tbName').value;
    var pwd = $('tbPwd').value;
    localStorage['autoLoginUser'] = name;
    localStorage['autoLoginPwd'] = pwd;

alert('设置成功');
}

$('btnSave').onclick = function(){
    saveUser();
};
