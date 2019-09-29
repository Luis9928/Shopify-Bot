// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
window.addEventListener('DOMContentLoaded', () => {
	const electron = require("electron");
	const Store = require('electron-store')
	const tokens = new Store({name: 'tokens'});
const ipc = electron.ipcRenderer

var today = new Date();
var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();

if (document.contains(document.getElementById('signIn'))){
var signin = document.getElementById('signIn');

signin.addEventListener('click', function(){
		var newWin = window.open("http://localhost:3000/", '_blank');
		newWin.focus();
})
}

else{


$("#capbtn").click(function(){
	var iframe = document.querySelectorAll('[role="presentation"]');
	ipc.send('token', grecaptcha.getResponse(), '6LeoeSkTAAAAAA9rkZs5oS82l69OEYjKRZAiKdaF');
	tokens.set(time, grecaptcha.getResponse());
	console.log(grecaptcha);
	location.reload();
})

  for (const versionType of ['chrome', 'electron', 'node']) {
  }
}
})
