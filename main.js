// Modules to control application life and create native browser window
const {app, BrowserWindow} = require('electron');
const parse = require('url-parse');
const path = require('path');
var request = require('request');
var HTMLParser = require('node-html-parser');
var cheerio = require('cheerio');
const Store = require('electron-store');
var express = require('express');
var bodyParser = require('body-parser');
const ipc = require('electron').ipcMain;
const fs = require('fs');
const pathIn = app.getPath('userData');
const expr = express();
const port = 3000
const puppeteer = require('puppeteer-extra');
const pluginStealth = require('puppeteer-extra-plugin-stealth')
puppeteer.use(pluginStealth())

const tokens = new Store({name: 'tokens'});

/*
###########################################################################################
###########################################################################################
################################## Main Window Creation####################################
###########################################################################################
###########################################################################################
*/

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1180,
    height: 600,
    frame: true,
    resizable: false,
    webPreferences: {
      nodeIntegration: true
    }
  })

  mainWindow.isResizable(true);

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) createWindow()
})


/*
###########################################################################################
###########################################################################################
################################## Captcha Window Creation#################################
###########################################################################################
###########################################################################################
*/

// Captcha Window
let captchaWindow

function createWindows () {
  var email = 'EMAIL GOES HERE';
  var password = 'PASSWORD GOES HERE';
	(async () => {
		const browser = await puppeteer.launch({
			headless: false,
			executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
		});  //{headless: false}*/

		  const page1 = await browser.newPage();
		  await page1.goto('https://accounts.google.com/signin/v2/identifier?service=CPanel&flowName=GlifWebSignIn&flowEntry=ServiceLogin', {
		    waitUntil: 'networkidle2'
		  });

		  await page1.waitForSelector('input[type="email"]')
		  await page1.type('input[type="email"]', email)
		  await page1.click('#identifierNext')
		  
		  await page1.waitForSelector('input[type="password"]', { visible: true })
		  await page1.type('input[type="password"]', password)  
		  
		  await page1.waitForSelector('#passwordNext', { visible: true })
		  await page1.click('#passwordNext')

		  await page1.waitForNavigation({
		    waitUntil: 'networkidle2'
		  });



		ipc.on('start', async function(event, userInfo, cardOB, taskOB){
				var cardNum1 = (cardOB.number).slice(0, 4);
				var cardNum2 = (cardOB.number).slice(4, 8);
				var cardNum3 = (cardOB.number).slice(8, 12);
				var cardNum4 = (cardOB.number).slice(12);
				var cardMonth = (cardOB.year).slice(2);
				console.log(cardMonth);

				console.log(taskOB.captcha);

				if (taskOB.mode == 'keywords'){
				  	var variant = await findProduct(taskOB);
				  	var siteInfo = await createCart(taskOB, variant);
				}else if (taskOB.mode == 'variants'){
					var siteInfo = await createCart(taskOB, taskOB.keyword);  
				}else if (taskOB.mode == 'url'){
					var variant = await findVariant(taskOB);
					var siteInfo = await createCart(taskOB, variant);
				}
				var urlw =  "https://" + siteInfo[0] + "/cart/" + variant + ":1?checkout[email]=" + userInfo.email + "&checkout[shipping_address][first_name]=" + userInfo.first + "&checkout[shipping_address][last_name]=" + userInfo.last + "&checkout[shipping_address][address1]=" + userInfo.address+ "&checkout[shipping_address][address2]=" + userInfo.apt + "&checkout[shipping_address][city]=" + userInfo.city + "&checkout[shipping_address][zip]=" + userInfo.zip;
				const page = await browser.newPage();

				await page.goto(urlw, {
			    waitUntil: 'networkidle2'
			    });

			  /*  await page.waitForNavigation({
		 			waitUntil: 'networkidle2'
		  		})*/

			    const capFrame = await page.$('#g-recaptcha > div > div > iframe');
				const capFr = await capFrame.contentFrame();
				await capFr.click('#recaptcha-anchor > div.recaptcha-checkbox-border');
				await page.waitForSelector('input[name="checkout[shipping_address][phone]"]',{visible: true, timeout :0});
				await page.type('input[name="checkout[shipping_address][phone]"]', userInfo.phone);

			  	await page.waitFor(1000);
				await page.click('button[name="button"]');
				await page.waitForNavigation({
					waitUntil: 'load'
				});
				await page.waitForSelector('body > div.content > div > div.main > div.main__content > div > form > div.step__footer > button')
				console.log('Worked');
				await page.waitFor(1000);
				await page.click('body > div.content > div > div.main > div.main__content > div > form > div.step__footer > button');

				await page.waitForNavigation({
					waitUntil: 'load'
				});

				await page.waitForSelector('iframe',{visible: true, timeout :0});
				await page.waitForSelector('iframe[title="Field container for: Card number"]',{visible: true, timeout :0});
				await page.waitFor(250);

				const cardSecurityHandle = await page.$('iframe[title="Field container for: Security code"]',);
				const cardSecurityFrame = await cardSecurityHandle.contentFrame();
				await cardSecurityFrame.click('input[name="verification_value"]');
				await page.keyboard.type(cardOB.csv)
				await page.waitFor(150);


				const cardDateHandle = await page.$('iframe[title="Field container for: Expiration date (MM / YY)"]',);
				const cardDateFrame = await cardDateHandle.contentFrame();
				await cardDateFrame.click('input[name="expiry"]');
				await page.keyboard.type(cardOB.month);
				await page.waitFor(50);
				await page.keyboard.type(cardMonth);
			  	await page.waitFor(150);


				const cardhandle = await page.$('iframe[title="Field container for: Card number"]', );
				const cardFrame = await cardhandle.contentFrame();
				await cardFrame.click('input[name="number"]');
				await page.waitFor(50);
				await page.keyboard.type(cardNum1);
				await page.waitFor(50);
				await page.keyboard.type(cardNum2)
				await page.waitFor(50);
				await page.keyboard.type(cardNum3);
				await page.waitFor(50);
				await page.keyboard.type(cardNum4)
				await page.waitFor(150);

				const cardNameHandle = await page.$('iframe[title="Field container for: Name on card"]',);
				const cardNameFrame = await cardNameHandle.contentFrame();
				await cardNameFrame.click('input[name="name"]');
				await page.keyboard.type(cardOB.first + " " + cardOB.last)
				await page.waitFor(150);




				await page.waitForSelector('button[data-trekkie-id="complete_order_button"]',{visible: true, timeout :0});
				await page.click('button[data-trekkie-id="complete_order_button"]');
			})
	}) ();

	/*tokens.clear();
	expr.set('port', process.env.PORT || 3000);
	expr.set('view engine', 'ejs');
	expr.use(bodyParser.json());
	expr.use(bodyParser.urlencoded({extended : true}));
	expr.set('views', path.join(__dirname, 'views'));

	expr.get('/', function(req, res) {
	  return res.render('index', {
	    url: parse('http://checkout.shopify.com'),
	    tokensGen: tokens.size.toString()
	  });
	});


	expr.post('/submit', function (req, res){
		var today = new Date();
		var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();

		tokens.set(time, req.body['g-recaptcha-response'])
		console.log(req.body['g-recaptcha-response']);

		return res.redirect('http://checkout.shopify.com:3000/')
	})

	expr.listen(expr.get('port'), () => {

	});*/
}


/*
###########################################################################################
###########################################################################################
##################################Captcha headless window##################################
###########################################################################################
###########################################################################################
*/
// siteInfo Array 0=Authority 1=Cookies  2=Path  3=CheckoutLink

function captchaHeadless(siteInfo, userInfo, variant, browser){
//var urlw =  "https://" + siteInfo[0] + "/cart/" + variant + ":1";
var urlw =  "https://" + siteInfo[0] + "/cart/" + variant + ":1?checkout[email]=" + userInfo.email + "&checkout[shipping_address][first_name]=" + userInfo.first + "&checkout[shipping_address][last_name]=" + userInfo.last + "&checkout[shipping_address][address1]=" + userInfo.address+ "&checkout[shipping_address][address2]=" + userInfo.apt + "&checkout[shipping_address][city]=" + userInfo.city + "&checkout[shipping_address][zip]=" + userInfo.zip;
console.log(urlw);
(async () => {




	const page = await browser.newPage();

	await page.goto(urlw, {
    waitUntil: 'networkidle2'
    });

	const capFrame = await page.$('#g-recaptcha > div > div > iframe');
	const capFr = await capFrame.contentFrame();
	await capFr.click('#recaptcha-anchor > div.recaptcha-checkbox-border');



  await page.waitForSelector('input[name="checkout[shipping_address][phone]"]',{visible: true, timeout :0});
  await page.type('input[name="checkout[shipping_address][phone]"]', userInfo.phone);

  await page.waitFor(700);
	await page.click('button[name="button"]');
	console.log('Worked');
	await page.waitForNavigation({
		waitUntil: 'networkidle0'
	});

	console.log('WORKED');

		}) ();

}

/*
###########################################################################################
###########################################################################################
##################################Task Process Functions###################################
###########################################################################################
###########################################################################################
*/

// Creates cart and returns an array containing variables used for headers
function createCart(taskOB, variant){

  var arr = [];

  var urlCart = `${taskOB.site}/cart/${variant}:1`;
  //console.log('s');
  console.log(urlCart);
  arr.push(taskOB.site);


  // Header for initial cart creation
  var headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.103 Safari/537.36',
    'Content-Type': 'application/x-www-form-urlencoded'
  } 

  var options = {
  method: 'GET',
  url: 'https://' + urlCart,
  port : 443,
  headers: headers
  }


  return new Promise(function(resolve, reject){
    request(options, function(error, response, body){
    if (!error && response.statusCode == 200){
      //console.log(response.statusCode);
      console.log(response.request['href']);
      arr.push((response.headers['set-cookie']));
      arr.push(response.request['path']);
      arr.push(response.request['href']);


      var headersS = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.103 Safari/537.36',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Cookie' : arr[1],
            'Origin': 'https://' + arr[0],
            'Referer': 'https://' + arr[0] + '/'

          }

    
      var optionsChe = {
        method: 'GET',
        url: arr[3],
        followAllRedirects: true,
        authority: arr[0],
        port : 443,
        path: arr[2],
        scheme: 'https',
        headers: headersS
      }


      request(optionsChe, function(error, response, body){
          //console.log('InfoSubmit');
          console.log('Good');
          //console.log(body);
          resolve(arr);
      })

      }else{
        // Header for initial cart creation
        var headersQ = {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.103 Safari/537.36',
          'Content-Type': 'application/x-www-form-urlencoded'
        } 

        var optionsQ = {
        method: 'GET',
        url: response['path'],
        port : 443,
        headers: headersQ
        }
        var queue = true; 

        while (queue == true){
          request(optionsQ, function(error, response, body){
              //console.log(response['body']);
              //console.log('InfoSubmit');
              console.log(response['location']);
              if (typeof response['location'] !== 'undefined'){
                arr.push((response.headers['set-cookie']));
                arr.push(response.request['path']);
                arr.push(response.request['href']);
                queue = false; 
                resolve(arr);
              }else{
                console.log(response.statusCode);
                console.log('Bad Cart');
                //console.log(response);
                console.log(response['path']);
              }
          })
        }

      //reject(response.statusCode);
      }
    })
  })

}



// siteInfo Array 0=Authority 1=Cookies  2=Path  3=CheckoutLink
// userInfo 0=email  1=FirstName   2=LastName  3=Address1
//      4=Address2   5=City   6=Country   7=Province
//      8=Zip   9=Phone
function submitUserInfo(siteInfo, profileOB){
	console.log('User Info');
  var headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.103 Safari/537.36',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie' : siteInfo[1],
        'Upgrade-Insecure-Requests': '1',
		'Accept-Encoding': 'gzip, deflate, br',
		'Accept-Language': 'en-US,en;q=0.9',
		'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3',
        'Origin': 'https://' + siteInfo[0],
        'Referer': 'https://' + siteInfo[0] + '/',
      }

  var options = {
  		scheme: 'https',
  		authority: siteInfo[0],
        method: 'POST',
        url: siteInfo[3],
        port : 443,
        headers: headers,
        path: siteInfo[2],
        form:{'_method': 'patch',
        'previous_step': 'contact_information',
        'step': 'shipping_method',
        'authenticity_token': '',
        'checkout[email]': profileOB.email,
        'checkout[buyer_accepts_marketing]': '0',
        'checkout[buyer_accepts_marketing]': '1',
        'checkout[shipping_address][first_name]': profileOB.first,
        'checkout[shipping_address][last_name]': profileOB.last,
        'checkout[shipping_address][address1]': profileOB.address,
        'checkout[shipping_address][address2]': profileOB.apt,
        'checkout[shipping_address][city]': profileOB.city,
        'checkout[shipping_address][country]': profileOB.country,
        'checkout[shipping_address][province]': profileOB.state,
        'checkout[shipping_address][zip]': profileOB.zip,
        'checkout[shipping_address][phone]': profileOB.phone,
    	'button': '',
		'checkout[client_details][browser_width]': '1280',
		'checkout[client_details][browser_height]': '619',
		'checkout[client_details][javascript_enabled]': '1'
    }
      }



  return new Promise(function(resolve, reject){
  	  request(options, function(error, response, body){
	    if (!error && response.statusCode == 302){
	      console.log(response.statusCode)
	      //console.log(body);
	      //console.log(options);

	      var optionsChe = {
	        method: 'GET',
	        url: siteInfo[3] + '?previous_step=contact_information&amp;step=shipping_method',
	        followAllRedirects: true,
	        authority: siteInfo[0],
	        port : 443,
	        path: siteInfo[2] + '?previous_step=contact_information&step=shipping_method',
	        scheme: 'https',
	        headers: headers
	      }

	      request(optionsChe, function(error, response, body){
	        //console.log(response['body']);
	        console.log('User Info Submit')
	        console.log('Good');
	        //console.log(body);
	        resolve()
	      })

	    }else{
	      console.log(response.statusCode);
	      console.log('Bad User Info');
	      //console.log(options);
	      //console.log(response);
	      resolve()
	      //console.log(response);
	      //console.log(siteInfo);
	      //console.log(capToken);
	      //console.log(body);
	    }
  		})
	})
}

function getShipping(siteInfo){
	var headers = {
		'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.103 Safari/537.36',
		'Content-Type': 'application/x-www-form-urlencoded',
		'Cookie' : siteInfo[1],
		'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3',
		'Referer': 'https://' + siteInfo[0] + '/',
		'Upgrade-Insecure-Requests': '1'
	}

	var options = {
		method: 'GET',
		url: siteInfo[3],
		followAllRedirects: true,
		authority: siteInfo[0],
		port : 443,
		path: siteInfo[2],
		scheme: 'https',
		headers: headers
	}
  	return new Promise(function(resolve, reject){

		request(options, function(error, response, body){
			if(!error && response.statusCode == 200){
				console.log(response.statusCode);
				console.log('Good. Shipping');
				//console.log(body);
				const $ = cheerio.load(body)
				resolve($('input[name="checkout[shipping_rate][id]"]').attr('value'));
				//console.log(body);
			}else{
				console.log(response.statusCode);
				console.log('Bad Shipping');
				//console.log(response);
				reject('');
			}
		})
	})
}

// siteInfo Array 0=Authority 1=Cookies  2=Path  3=CheckoutLink
async function submitShipping(siteInfo, taskOB){
  	if (taskOB.shipping == 'none'){
  		var shipping = await getShipping(siteInfo);
	}else{
		var shipping = taskOB.shipping;
	}

console.log(shipping);
var headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.103 Safari/537.36',
    'Content-Type': 'application/x-www-form-urlencoded',
    'Cookie' : siteInfo[1],
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3',
    'Referer': 'https://' + siteInfo[0] + '/',
    'Upgrade-Insecure-Requests': '1'
  }

  var options = {
      method: 'POST',
      url: siteInfo[3] + '?previous_step=contact_information&amp;step=shipping_method',
      followAllRedirects: false,
      authority: siteInfo[0],
      port : 443,
      path: siteInfo[2],
      scheme: 'https',
      headers: headers,
      form:{
        '_method': 'patch',
        'authenticity_token': '',
        'previous_step': 'shipping_method',
        'step': 'payment_method',
        'checkout[shipping_rate][id]': shipping
      }
    }
  return new Promise(function(resolve, reject){
  request(options, function(error, response, body){
    if(!error && response.statusCode == 302){
      console.log(response.statusCode);
      console.log('Good. Shipping');
      //console.log(options);
      resolve();
    }else{
      console.log(response.statusCode);
      console.log('Bad Submit Shipping');
      //console.log(response);
    }
  })

})


}

//Function loads payment page and return the gateway
// siteInfo Array 0=Authority 1=Cookies  2=Path  3=CheckoutLink
function getGateway(siteInfo){

  var checkPath = siteInfo[2] + '?previous_step=shipping_method&step=payment_method'

  var headers= {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.103 Safari/537.36',
    'Content-Type': 'application/x-www-form-urlencoded',
    'Cookie' : siteInfo[1],
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3',
    'Referer': 'https://' + siteInfo[0],
    'Upgrade-Insecure-Requests': '1'
  }

  var optionsChe = {
      method: 'GET',
      url: siteInfo[3] + '?previous_step=shipping_method&step=payment_method',
      followAllRedirects: true,
      authenticity_token: '',
      authority: siteInfo[0],
      port : 443,
      path: checkPath,
      scheme: 'https',
      headers: headers
    }

  return new Promise(function(resolve, reject){
  request(optionsChe, function(error, response, body){
    if(!error){
    console.log(response.statusCode);
    console.log('Good');
    console.log(body);
    const $ = cheerio.load(body)
    var gateway = $('input[name="checkout[payment_gateway]"]').attr('value')
    console.log(gateway);
    //console.log(body);
    resolve ($('input[name="checkout[payment_gateway]"]').attr('value'))
    }else{
      console.log('Bad gateway');
      reject(response)
    }
  })

  })
}

// Function calls Shopify payment API and returns a payment token
function createPaymentToken(cardOB){

  var cardInfo = {
    "credit_card": {
      "number": cardOB.number,
      "first_name": cardOB.first,
      "last_name": cardOB.last,
      "month": cardOB.month,
      "year": cardOB.year,
      "verification_value": cardOB.csv
    }
  };

  var headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.103 Safari/537.36'
    }

  var optionsPay = {
      method: 'POST',
      url: 'https://elb.deposit.shopifycs.com/sessions',
      port : 443,
      headers: headers,
      body: cardInfo,
      json: true
    }
  return new Promise(function(resolve, reject){
    request(optionsPay, function(error, response, body){
      if(!error && response.statusCode==200){
        console.log(response.statusCode);
        console.log('Good');
        resolve((body['id']))
      }else{
        console.log(response.statusCode);
        console.log('Bad Payment');
       // console.log(response);
        reject(response)
      }
    })
  })
}


// siteInfo Array 0=Authority 1=Cookies  2=Path  3=CheckoutLink
// userInfo 0=email  1=FirstName   2=LastName  3=Address1
//      4=Address2   5=City   6=Country   7=Province
//      8=Zip   9=Phone
function submitOrder(payment, gateway, siteInfo){
  var headers= {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.103 Safari/537.36',
    'Content-Type': 'application/x-www-form-urlencoded',
    'Cookie' : siteInfo[1],
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3',
    'Referer': 'https://' + siteInfo[0] + 'previous_step=shipping_method&step=payment_method',
    'Upgrade-Insecure-Requests': '1'
  }

  var options = {
      method: 'POST',
      url: siteInfo[3] + '?previous_step=shipping_method&step=payment_method',
      followAllRedirects: true,
      authority: siteInfo[0],
      port : 443,
      path: siteInfo[2],
      scheme: 'https',
      headers: headers,
      form:{
          '_method': 'patch',
          'authenticity_token': '',
          'previous_step': 'payment_method',
          'step': '',
          's': payment,
          'checkout[payment_gateway]': gateway,
          'checkout[credit_card][vault]': false,
          'checkout[different_billing_address]': false,
          'checkout[remember_me]':false,
          'checkout[remember_me]': 0,
          'checkout[vault_phone]': '+1NUMBER HERE', // Replace with own number
          'complete':1
      }
  }

  request(options, function(error, response, body){
    if(!error && response.statusCode == 200){
      console.log(response.statusCode);
      console.log('Payment success');
      //sconsole.log(response);
    }else{
      console.log(response.statusCode);
      console.log('Payment Failed');
    }
  })
}


function queue (link, cardOB, taskOB, userInfo){
	(async () => {

		const browser = await puppeteer.launch({
			headless: false,
			executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
		});  //{headless: false}*/

		
		var cardNum1 = (cardOB.number).slice(0, 4);
		var cardNum2 = (cardOB.number).slice(4, 8);
		var cardNum3 = (cardOB.number).slice(8, 12);
		var cardNum4 = (cardOB.number).slice(12);
		var cardMonth = (cardOB.year).slice(2);
		console.log(cardMonth);

		console.log(taskOB.captcha);

		var urlw =  `${link}`
		const page = await browser.newPage();

		await page.goto(urlw, {
	    	waitUntil: 'networkidle2'
	    });

		await page.waitForNavigation({
			waitUntil: 'networkidle2'
		});
	    const capFrame = await page.$('#g-recaptcha > div > div > iframe');
		const capFr = await capFrame.contentFrame();
		await capFr.click('#recaptcha-anchor > div.recaptcha-checkbox-border');
		await page.waitForSelector('input[name="checkout[shipping_address][phone]"]',{visible: true, timeout :0});
		await page.type('input[name="checkout[shipping_address][phone]"]', userInfo.phone);

	  	await page.waitFor(1000);
		await page.click('button[name="button"]');
		await page.waitForNavigation({
			waitUntil: 'load'
		});
		await page.waitForSelector('body > div.content > div > div.main > div.main__content > div > form > div.step__footer > button')
		console.log('Worked');
		await page.waitFor(1000);
		await page.click('body > div.content > div > div.main > div.main__content > div > form > div.step__footer > button');

		await page.waitForNavigation({
			waitUntil: 'load'
		});

		await page.waitForSelector('iframe',{visible: true, timeout :0});
		await page.waitForSelector('iframe[title="Field container for: Card number"]',{visible: true, timeout :0});
		await page.waitFor(250);

		const cardSecurityHandle = await page.$('iframe[title="Field container for: Security code"]',);
		const cardSecurityFrame = await cardSecurityHandle.contentFrame();
		await cardSecurityFrame.click('input[name="verification_value"]');
		await page.keyboard.type(cardOB.csv)
		await page.waitFor(150);


		const cardDateHandle = await page.$('iframe[title="Field container for: Expiration date (MM / YY)"]',);
		const cardDateFrame = await cardDateHandle.contentFrame();
		await cardDateFrame.click('input[name="expiry"]');
		await page.keyboard.type(cardOB.month);
		await page.waitFor(50);
		await page.keyboard.type(cardMonth);
	  	await page.waitFor(150);


		const cardhandle = await page.$('iframe[title="Field container for: Card number"]', );
		const cardFrame = await cardhandle.contentFrame();
		await cardFrame.click('input[name="number"]');
		await page.waitFor(50);
		await page.keyboard.type(cardNum1);
		await page.waitFor(50);
		await page.keyboard.type(cardNum2)
		await page.waitFor(50);
		await page.keyboard.type(cardNum3);
		await page.waitFor(50);
		await page.keyboard.type(cardNum4)
		await page.waitFor(150);

		const cardNameHandle = await page.$('iframe[title="Field container for: Name on card"]',);
		const cardNameFrame = await cardNameHandle.contentFrame();
		await cardNameFrame.click('input[name="name"]');
		await page.keyboard.type(cardOB.first + " " + cardOB.last)
		await page.waitFor(150);




		await page.waitForSelector('button[data-trekkie-id="complete_order_button"]',{visible: true, timeout :0});
		await page.click('button[data-trekkie-id="complete_order_button"]');
	}) ();
}


/*
###########################################################################################
###########################################################################################
####################################Start Task Funnctions##################################
###########################################################################################
###########################################################################################
*/


async function startTasks(profileOB, cardOB, taskOB){
	console.log(taskOB.mode);
	if (taskOB.captcha == true){

	}else{
		if (taskOB.mode == 'keywords'){
			var variant = await findProduct(taskOB);
			var siteInfo = await createCart(taskOB, variant);

	  	}else if (taskOB.mode == 'variants'){
	  		var siteInfo = await createCart(taskOB, taskOB.keyword);  
	  	}else if (taskOB.mode == 'url'){
	  		var variant = await findVariant(taskOB);
	  		var siteInfo = await createCart(taskOB, variant);
	  	}

	  	if (siteInfo[3].includes(queue)){

	  	}else{
	  		await submitUserInfo(siteInfo, profileOB);
			//await console.log(siteInfo);
			await submitShipping(siteInfo, taskOB);
			var gateway = await getGateway(siteInfo);
			var paymentToken = await createPaymentToken(cardOB);
			submitOrder(paymentToken, gateway, siteInfo);
		}
	}
}

function findProduct(taskOB){
	var keywordsArr = taskOB.keyword.split(',');

	var productJson = `https://${taskOB.site}/products.json?limit=250`

	var headers = {
		'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.103 Safari/537.36',
		'Content-Type': 'application/json; charset=utf-8',
		'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3',
	} 

	var options = {
		method: 'GET',
		url: productJson,
		port : 443,
		headers: headers,
		path: ' /products.json',
		json: true
	}

	return new Promise(function(resolve, reject){

		request(options, function(error, response, body){

			if (!error && response.statusCode == 200){
				var productList = JSON.stringify(body.products);
        var highestMatch = 0;
        var highestMatchProduct;

        // Parse list of products from product.json file
        for (var i = 0; i < body.products.length; i++) {
          var productName = body.products[i].title.toLowerCase();
          var wordsMatched = 0;

          // Check how many keywords match with the product title
          for (var j = 0; j < keywordsArr.length; j++){
            if (productName.includes(keywordsArr[j].toLowerCase())){
              wordsMatched++;
            }
          }

          // If keywords matched is higher than last highest count 
          // Update counter and replace product that better matches keywords
          if (wordsMatched > highestMatch){
            highestMatch = wordsMatched;
            highestMatchProduct = body.products[i];
          }
      }

          var wordsInTitle = highestMatchProduct.title.split(/\s+\b/).length;
          if ((keywordsArr.length/2) > highestMatch){
            reject(`Can't Find product`);
          }else{
            var sizeIndex = getSize(highestMatchProduct.variants, taskOB.size);
            if (typeof sizeIndex !== 'undefined'){
              resolve(highestMatchProduct.variants[sizeIndex].id);
            }else if(taskOB.type == 'none'){
              resolve(highestMatchProduct.variants[0].id);
            }else{
              console.log('Size not found');
              reject('Not Found size')
            }
            console.log(highestMatchProduct);
          }

			}else{
				reject(`Can't connect to products page`);
			}
		})

	})


}

function getSize (variants, sizeS){
  var i; 
  //console.log(variants);
  for (i = 0; i < variants.length; i++){
    if (variants[i].title == sizeS || (variants[i].title).includes(sizeS + 'US') || (variants[i].option1).includes(sizeS) ){
      return i;
    }
  }
}

function findVariant(taskOB){
	console.log('Entering Find var');

  var productJson = `${taskOB.keyword}.json`

  var headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.103 Safari/537.36',
    'Content-Type': 'application/json; charset=utf-8',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3',
  } 

  var options = {
  method: 'GET',
  url: productJson,
  port : 443,
  headers: headers,
  json: true
  }

  return new Promise(function(resolve, reject){

  request(options, function(error, response, body){

    if (!error && response.statusCode == 200){
      var string = JSON.stringify(body);
      var productList = JSON.parse(string);

     console.log(body.product.variants.length);
     var numVariants = body.product.variants.length;

     if (taskOB.size == 'none'){
     	resolve (body.product.variants[0].id);
     }else{
     for (var i = 0; i < numVariants; i++){
     	//console.log(body.product.variants[i].title);
     	if(body.product.variants[i].title.includes(taskOB.size)){
     		resolve (body.product.variants[i].id);
     	}
     }
 }
     reject('oof find var')
 	}
 	reject('oof find var')
  })
})
}

function assignCaptcha(siteInfo){
	const tokens = new Store({name: 'tokens'});
	return new Promise(function(resolve, reject){
			if (tokens.size > 0){
				for (var token in tokens.get()){
					console.log(token);
					var capt = tokens.get(token);
					tokens.delete(token);
					resolve(capt);
					break;
				}
			}else {
				resolve('');
			}
		})
	}





/*
###########################################################################################
###########################################################################################
######################################IPC functions########################################
###########################################################################################
###########################################################################################
*/
ipc.on('captcha', function(event){

	createWindows();
})


ipc.on('form', function(event, info){
  const store = new Store({name: 'profiles'});

	store.set(info[0], '');
	store.set( info[0] + '.first', info[1]);
	store.set( info[0] + '.last', info[2]);
	store.set( info[0] + '.email', info[3]);
	store.set( info[0] + '.address', info[4]);
	store.set( info[0] + '.apt', info[5]);
	store.set( info[0] + '.city', info[6]);
	store.set( info[0] + '.country', info[7]);
	store.set( info[0] + '.state', info[8]);
	store.set( info[0] + '.zip', info[9]);
	store.set( info[0] + '.phone', info[10]);
  store.set( info[0] + '.card', info[11]);

  const storeC = new Store({name: 'cards'});
  storeC.set(`${info[11]}`, '');
  storeC.set(`${info[11]}.first`, info[12])
  storeC.set(`${info[11]}.last`, info[13])
  storeC.set(`${info[11]}.number`, info[14])
  storeC.set(`${info[11]}.month`, info[15])
  storeC.set(`${info[11]}.year`, info[16])
  storeC.set(`${info[11]}.csv`, info[17])


	console.log(info);
	console.log(app.getPath('userData'));

  event.reply('profileSuccess')

})

ipc.on('createTask', function(event, task){
  const store = new Store({name: 'task'});

  const cSize =  task[9];
  store.set(cSize, '');
  store.set(cSize + '.profile',task[0])
  store.set(cSize + '.site',task[1])
  store.set(cSize + '.siteName',task[2])
  store.set(cSize+ '.mode',task[3])
  store.set(cSize + '.keyword',task[4])
  store.set(cSize + '.size', task[5])
  store.set(cSize + '.shipping', task[6])
  store.set(cSize + '.type', task[7])
  store.set(cSize + '.captcha', task[8])
  event.reply('taskSuccess')

})

ipc.on('start', function(event, profileOB, cardOB, taskOB){
  startTasks(profileOB, cardOB, taskOB);
})

