const electron = require("electron");
const ipc = electron.ipcRenderer
const Store = require('electron-store')
const storeProfiles = new Store({name: 'profiles'});
const storeCards = new Store({name: 'profiles'});


makeProfileList().then(function(value){
    profileAddButtonActions();
})

var taskLoaded = 0;
var profileLoaded = 0;

/*ipc.on('profileSuccess', (event) =>{
  addProfile();
  var container = document.getElementById('profileList');
  var content = container.innerHTML;
  container.innerHTML = content;
})*/

$('#saveProf').click(function(){
    sendForm();
})


$("#newProfile").click(function(){
    document.getElementById('profilename').value= "";
    document.getElementById('firstname').value= "";
    document.getElementById('lastname').value= "";
    document.getElementById('email').value= "";
    document.getElementById('address').value= "";
    document.getElementById('city').value= "";
    document.getElementById('country').value= "";
    document.getElementById('state').value= "";
    document.getElementById('zip').value= "";
    document.getElementById('phone').value= "";
    document.getElementById('cardProfile').value= "";
    document.getElementById('firstnameCard').value= "";
    document.getElementById('lastnameCard').value= "";
    document.getElementById('cardNumber').value= "";
    document.getElementById('cardCsv').value= "";
    document.getElementById('monthSelect').value= "none";
    document.getElementById('yearSelect').value= "none";

})

function sendForm() {
    const months = document.getElementById('monthSelect')
    const years = document.getElementById('yearSelect')
    var info = [];
    event.preventDefault() // stop the form from submitting
    info.push(document.getElementById("profilename").value);
    info.push(document.getElementById("firstname").value);
    info.push(document.getElementById("lastname").value);
    info.push(document.getElementById("email").value);
    info.push(document.getElementById("address").value);
    info.push(document.getElementById("apt").value);
    info.push(document.getElementById("city").value);
    info.push(document.getElementById("country").value);
    info.push(document.getElementById("state").value);
    info.push(document.getElementById("zip").value);
    info.push(document.getElementById("phone").value);
    info.push(document.getElementById("cardProfile").value);
    info.push(document.getElementById("firstnameCard").value);
    info.push(document.getElementById("lastnameCard").value);
    info.push(document.getElementById("cardNumber").value);
    info.push(months.options[months.selectedIndex].value);
    info.push(years.options[years.selectedIndex].value);
    info.push(document.getElementById("cardCsv").value);
    ipc.send('form', info)
    UIkit.notification({message: 'Success', status: 'success', timeout: '250', pos: 'bottom-right'})

    var profileReloadPromise = new Promise(function(resolve, reject){

    setTimeout(function(){
    addProfile();
    var container = document.getElementById('profileList');
    var content = container.innerHTML;
    container.innerHTML = content;
    resolve('');
    },250);

    });

    profileReloadPromise.then(function(value){
        profileAddButtonActions();
    });

}

function makeProfileList (){
    return new Promise(function(resolve, reject){
        for (var profileIn in storeProfiles.get()){
            //console.log(profileIn.toString());
            var profileIndex = profileIn.toString();
            var cardSelected = storeProfiles.get(`${profileIndex}.card`);

            var liHtml = `<li id="${profileIndex}" style="background-color: lightblue"> 
                            <div uk-grid class="uk-child-width-1-3 uk-text-center">
                                <div>${profileIndex}</div>
                                <div>${cardSelected}</div>
                                <div>
                                    <a value="${profileIndex}" id="${profileIndex}edit" href="#" class="uk-margin-small-right" uk-icon="icon: file-edit; ratio: 0.80"></a>
                                    <a value="${profileIndex}" id="${profileIndex}delete" href="#" class="uk-margin-small-right" uk-icon="icon: trash; ratio: 0.80"></a>
                                </div>
                            </div>
                          </li>`
            


            var liElement = document.createElement("li");
            liElement.innerHTML = liHtml;
            document.getElementById('profileList').appendChild(liElement);
        }
    resolve('');
    })
}

function addProfile(){
    return new Promise(function(resolve, reject){
    var profileIndex = document.getElementById('profilename').value;
    //console.log(storeProfiles.get(`${profileIndex}`));
    var cardSelected = storeProfiles.get(`${profileIndex}.card`);


            var liHtml = `<li id="${profileIndex}" style="background-color: lightblue"> 
                            <div uk-grid class="uk-child-width-1-3 uk-text-center">
                                <div>${profileIndex}</div>
                                <div>${cardSelected}</div>
                                <div>
                                    <a value="${profileIndex}" id="${profileIndex}edit" href="#" class="uk-margin-small-right" uk-icon="icon: file-edit; ratio: 0.80"></a>
                                    <a value="${profileIndex}" id="${profileIndex}delete" href="#" class="uk-margin-small-right" uk-icon="icon: trash; ratio: 0.80"></a>
                                </div>
                            </div>
                          </li>`

    var liElement = document.createElement("li");
    liElement.innerHTML = liHtml;
    document.getElementById('profileList').appendChild(liElement);
})
}

function profileAddButtonActions(){
    for (var t in storeProfiles.get()){
        document.getElementById(t.toString() + "edit").addEventListener("click", function(){
            console.log(this.getAttribute("value"));
        });


        document.getElementById(t.toString() + "delete").addEventListener("click", function(){
            document.getElementById(this.getAttribute("value")).remove();
            storeProfiles.delete(this.getAttribute("value"));
        });
    }
}