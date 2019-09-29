const electron = require("electron");
const ipc = electron.ipcRenderer


const catpchaBtn = document.getElementById('capbtn');
    catpchaBtn.addEventListener('click', function(){

      console.log($('#recaptcha-token').val());
      ipc.send('r');
    })