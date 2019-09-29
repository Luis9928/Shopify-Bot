const electron = require("electron");
const Store = require('electron-store')
const storeProfiles = new Store({name: 'profiles'});
const storeTask = new Store({name: 'task'});
const storeCard = new Store({name: 'cards'});
const ipc = electron.ipcRenderer

const catpchaBtn = document.getElementById('captcha')

var profiles = document.getElementById('profileSelect');
var sites = document.getElementById('siteSelect');
var modes = document.getElementById('modeSelect');
var keyword = document.getElementById('key');
var sizes = document.getElementById('sizeSelect');
var shipping = document.getElementById('shippingSelect');
var prodType = document.getElementById('typeSelect');
var customSi = document.getElementById('customSite');
var captchaRa = document.getElementById('captchaRadio');


var profilesEdit = document.getElementById('profileSelectEdit');
var sitesEdit = document.getElementById('siteSelectEdit');
var modesEdit = document.getElementById('modeSelectEdit');
var keywordEdit = document.getElementById('keyEdit');

console.log(storeTask.path);

makeList().then(function(value){
	addButtonActions();
})
getProfiles();

catpchaBtn.addEventListener('click', function(){
	ipc.send('captcha')
})

/*ipc.on('taskSuccess', (event) =>{
  addTask();
  var container = document.getElementById('taskList');
  var content = container.innerHTML;
  container.innerHTML = content;
})*/

$("#newTask").click(function(){
	sites.value = "none";
	profiles.value = "none";
	modes.value = "none";
	keyword.value = "";
	sizes.value = "none";
	prodType.value = "none";
	shipping.value = "none"
	$('#customSite').hide();
	captchaRa.checked = false;

})

$("#saveBtn").click(function(){
	var task = [];
	var taskIndex = randomString();
	task.push(profiles.options[profiles.selectedIndex].value);
	//task.push(sites.options[sites.selectedIndex].value);
	//task.push(sites.options[sites.selectedIndex].text);
	if (sites.options[sites.selectedIndex].text == 'Custom Site'){
		//task.push(customSi.value);
		var s = customSi.value;
		var custom = s.replace(/^https?\:\/\//i, "");
		task.push(custom);

	}else{
		task.push(sites.options[sites.selectedIndex].value);
	}
	task.push(sites.options[sites.selectedIndex].text);
	task.push(modes.options[modes.selectedIndex].value);
	task.push(keyword.value);
	task.push(sizes.value);
	task.push(shipping.options[shipping.selectedIndex].value);
	task.push(prodType.options[prodType.selectedIndex].value);
	task.push(captchaRa.checked);
	task.push(taskIndex);
	UIkit.notification({message: 'Success', status: 'success', timeout: '250', pos: 'bottom-right'})
	ipc.send('createTask', task);
	var reloadPromise = new Promise(function(resolve, reject){
		setTimeout(function(){
			addTask(taskIndex);
			var container = document.getElementById('taskList');
		  	var content = container.innerHTML;
		  	container.innerHTML = content;
		  	trash = document.getElementsByName("task_trash");
		  	resolve('');
		}, 250);
	});

	reloadPromise.then(function(value){
		addButtonActions();
	});
})

$("#clear").click(function(){
  storeTask.clear();
  var container = document.getElementById('taskList');
  $('#taskList').replaceWith('<ul id="taskList" class="uk-list" style="background-color: black"></ul>');
  makeList();
})


/*$("#task_delete").click(function(){
	console.log($(this).attr('value'));
	storeTask.delete($(this).attr('value'));
})*/


//Select site and add shipping accordingly
$("#siteSelect").change(function(){
	var seSite = $(this).val();
	console.log(seSite);
	if (seSite == "kith.com"){
		$("#shippingSelect").html("<option id='none' value='none' selected disabled>Shipping</option><option value='shopify-UPS%20GROUND%20(5-7%20business%20days)-10.00'>Kith Flat Rate $10</option>");
		$('#customSite').hide();
	}else if(seSite == "www.deadstock.ca"){
	 	$("#shippingSelect").html("<option id='none' value='none' selected disabled>Shipping</option><option value='shopify-FREE%20-%20FedEx%20Ground%205%20-%207%20Day-0.00'>FREE - FedEx Ground 5 - 7 Day</option><option value='shopify-FREE%20-%20FedEx%20Ground%20USA%205%20-%207%20Day%20W/%20Signature-0.00'>FREE - FedEx Ground USA 5 - 7 Day W/ Signature</option><option value='shopify-FedEx%20Express%20USA%202%20Day%20W/%20Signature-24.50'>	FedEx Express USA 2 Day W/ Signature</option>");
		$('#customSite').hide();
	}else if (seSite == "bringtheheatbots.com"){
		$("#shippingSelect").html("<option id='none' value='none' selected disabled>Shipping</option><option value='shopify-Free-0.00'>BTH Ship</option>");
		$('#customSite').hide();
	}else if (seSite == "custom"){
		$('#customSite').show();
	}
})


$("#typeSelect").change(function(){
	var seType = $(this).val();
	console.log(seType);
	if (seType == "foot"){
		$("#sizeSelect").html("<option id='none' value='none' selected disabled>Size</option><option id='size3' value='3'>3</option><option id='size3_5' value='3.5'>3.5</option> <option id='size4' value='4'>4</option> <option id='size4_5'value='4.5'>4.5</option> <option id='size5' value='5'>5</option> <option id='size5_5' value='5.5'>5.5</option><option id='size6' value='6'>6</option> <option id='size6_5' value='6.5'>6.5</option> <option id='size7'value='7'>7</option> <option id='size7_5' value='7.5'>7.5</option> <option id='size8' value='8'>8</option><option id='size8_5' value='8.5'>8.5</option> <option id='size9' value='9'>9</option> <option id='size9_5'value='9.5'>9.5</option> <option id='size10' value='10'>10</option> <option id='size10_5'value='10.5'>10.5</option> <option id='size11' value='11'>11</option> <option id='size11_5'value='11.5'>11.5</option> <option id='size12' value='12'>12</option> <option id='size12_5'value='12.5'>12.5</option> <option id='size13' value='13'>13</option> <option id='size13_5'value='13.5'>13.5</option> <option id='size14' value='14'>14</option> <option id='size14_5'value='14.5'>14.5</option> <option id='size15' value='15'>15</option");
	
	}else if (seType = "apparel"){
		$("#sizeSelect").html("<option id='none' value='none' selected disabled>Size</option><option id='small' value='small'>S</option><option id='medium' value='medium'>M</option><option id='large' value='large'>L</option><option id='extra_large' value='extra_large'>XL</option>");
	}
})

//Start all task button action
$("#startTask").click(function(){
	startAllTasks();
})

// Get profiles from profile.json 
function getProfiles (){
	for (var key in storeProfiles.get()){
	//console.log(key.toString());
	var profile = document.createElement("option");
	profile.textContent = key;
	profile.value = key;
	profiles.appendChild(profile);
	}
}

// Makes list 
function makeList (){  
return new Promise(function(resolve, reject){
	for (var taskSt in storeTask.get()){
	//console.log(taskSt.toString());
	var taskIndex = taskSt.toString();
	var profileList = storeTask.get(`${taskIndex}.profile`);
	var siteName = storeTask.get(`${taskIndex}.siteName`);
	var modeList = storeTask.get(`${taskIndex}.mode`);
	var keywordList = storeTask.get(`${taskIndex}.keyword`);

	var sizeList = storeTask.get(`${taskIndex}.size`);


	var liHtml = `<li id="${taskIndex}" style="background-color: lightblue"> 
					<div uk-grid class="uk-child-width-1-6 uk-text-center">
						<div>${profileList}</div>
						<div>${siteName}</div>
						<div>${keywordList}</div>
						<div>${sizeList}</div>
						<div>Status</div>
						<div>
							<a value="${taskIndex}" id="${taskIndex}task_play" href="#" class="uk-margin-small-right" uk-icon="icon: play; ratio: 0.85"></a>
							<a uk-toggle="target: #taskWin" value="${taskIndex}" id="${taskIndex}task_edit" href="#" class="uk-margin-small-right" uk-icon="icon: file-edit; ratio: 0.80"></a>
							<a value="${taskIndex}" id="${taskIndex}task_delete" href="#" class="uk-margin-small-right" uk-icon="icon: trash; ratio: 0.80"></a>
						</div>
					</div>
				  </li>`

	var liElement = document.createElement("li");
	liElement.innerHTML = liHtml;

	document.getElementById('taskList').appendChild(liElement);
	}

	resolve('work')
	})

}

// Add new task to list 
function addTask (taskIndex){
	//return new Promise(function(resolve, reject){
	var profileList = storeTask.get(`${taskIndex}.profile`);
	var siteName = storeTask.get(`${taskIndex}.siteName`);
	var modeList = storeTask.get(`${taskIndex}.mode`);
	var keywordList = storeTask.get(`${taskIndex}.keyword`);

	var sizeList = storeTask.get(`${taskIndex}.size`);


	var liHtml = `<li id="${taskIndex}" style="background-color: lightblue"> 
					<div uk-grid class="uk-child-width-1-6 uk-text-center">
						<div>${profileList}</div>
						<div>${siteName}</div>
						<div>${keywordList}</div>
						<div>${sizeList}</div>
						<div>Status</div>
						<div>
							<a value="${taskIndex}" id="${taskIndex}task_play" href="#" class="uk-margin-small-right" uk-icon="icon: play; ratio: 0.85"></a>
							<a uk-toggle="target: #taskWin" value="${taskIndex}" id="${taskIndex}task_edit" href="#" class="uk-margin-small-right" uk-icon="icon: file-edit; ratio: 0.80"></a>
							<a value="${taskIndex}" id="${taskIndex}task_delete" href="#" class="uk-margin-small-right" uk-icon="icon: trash; ratio: 0.80"></a>
						</div>
					</div>
				  </li>`
	
	var liElement = document.createElement("li");
	liElement.innerHTML = liHtml;
	document.getElementById('taskList').appendChild(liElement);
	//resolve(taskIndex)
//})
}

function addButtonActions(){ 
	for (var t in storeTask.get()){
		document.getElementById(t.toString() + "task_play").addEventListener("click", function(){
			var indexPro = this.getAttribute("value")
			var profileT = storeTask.get(`${indexPro}.profile`);
			var profileOB = storeProfiles.get(`${profileT}`)
			var taskOB = storeTask.get(`${indexPro}`)
			var cardOB = storeCard.get(profileOB.card)

			console.log(profileOB);
			console.log(cardOB);

			ipc.send('start', profileOB, cardOB, taskOB);

		});

		document.getElementById(t.toString() + "task_edit").addEventListener("click", function(){
		});

		document.getElementById(t.toString() + "task_delete").addEventListener("click", function(){
			document.getElementById(this.getAttribute("value")).remove();
			//storeTask.delete(this.getAttribute("value"));
			deleteTask(this.getAttribute("value"));
		});
	}
}

function deleteTask(taskIndex){
	console.log();
	storeTask.delete(taskIndex);
	var i = storeTask.size;
	for (i = i - 1; i > taskIndex; taskIndex++){
		var ind = taskIndex + 1;
		//storeTask.set(ind.toString(), taskIndex.toString())
		console.log(ind.toString());
		console.log(taskIndex.toString());
	}
}

function startAllTasks(){
	for (var taskAl in storeTask.get()){
	//console.log(taskSt.toString());
	var taskIndex = taskAl.toString();
	var profileT = storeTask.get(`${taskIndex}.profile`);


	var profileOB = storeProfiles.get(`${profileT}`)
	var cardOB = storeCard.get(profileOB.card)
	var taskOB = storeTask.get(`${taskIndex}`)

	console.log(profileOB);
	console.log(cardOB);

	ipc.send('start', profileOB, cardOB, taskOB);

	}
}

function randomString() {
	var chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var result = '';
    for (var i = 5; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
}
/*function newButtonActions(taskIndex){
	var index =taskIndex.toString();
		document.getElementById(index + "task_play").addEventListener("click", function(){
			console.log(taskIndex);
		});

		document.getElementById(index + "task_edit").addEventListener("click", function(){
			console.log(taskIndex);
		});

		document.getElementById(index + "task_delete").addEventListener("click", function(){
			document.getElementById(index).remove();
			storeTask.delete(index);
		});
}*/



