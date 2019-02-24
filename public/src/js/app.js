var deferredPrompt;
var enableNotificationsButtons = document.querySelectorAll(".enable-notifications");


if(!window.Promise){
    window.Promise=Promise;
}

if('serviceWorker' in navigator){
    navigator.serviceWorker.register('/sw.js').then(function(){
        console.log("Service Worker Registered")
    }).catch(function(err){
        console.log(err);
    });
}

window.addEventListener('beforeinstallprompt',function(event){
    console.log("beforeinstallprompt fired");
    event.preventDefault();
    deferredPrompt=event;
    return false;
});

function displayConfirmedNotifications(){
    if('serviceWorker' in navigator){
        var options={
            body:"You have successfully subscribed to notifications Service!!",
            icon:'/src/images/icons/app-icon-96x96.png',
            image:'/src/images/OGS.jpg',
            dir:'ltr',
            lang:'en-US', //BSP 47
            vibrate:[100,50,200],
            badge:'/src/images/icons/app-icon-96x96.png',
            tag:'confirm-notification',
            renotify:true,
            actions :[
                {action:'confirm',title:'Okay!',icon:'/src/images/icons/app-icon-96x96.png'},
                {action:'cancel',title:'Cancel!',icon:'/src/images/icons/app-icon-96x96.png'}
            ]
        };
        navigator.serviceWorker.ready.then(function(swreg){
            swreg.showNotification("Successfully subscribed!",options);
        });
    }
}

function configurePushSub(){
    if(!('serviceWorker' in navigator)){
        return;
    }
    var reg;
    navigator.serviceWorker.ready.then(function(swreg){
        reg=swreg;
        return swreg.pushManager.getSubscription();
    })
    .then(function(sub){
        if(sub==null){
            //create new Subsciption
            var vapidPublicKey = "BO9DWoUGSfjJkhnJ5Lr3NDl1jU2LEolehLU0apycf3wEG3LYZ5Qzw0xGySlNQnlBbLBNtIfeIHdp1C1CnlxTQ2g";
            var convertedVapidPublicKey = urlBase64ToUint8Array(vapidPublicKey);
            return reg.pushManager.subscribe({
                userVisibleOnly : true,
                applicationServerKey:convertedVapidPublicKey
            });
        }
        else{
            //We have a subscription
        }
    })
    .then(function(newSub){
        return fetch("https://pictureit-e41c1.firebaseio.com/subscriptions.json",{
            method:"POST",
            headers:{
            "Content-Type":"application/json",
            "Accept":"application/json",
            },
            body:JSON.stringify(newSub)
        })
    })
    .then(function(response){
        if(response.ok){
            displayConfirmedNotifications();
        }
    })
    .catch(function(err){
        console.log(err);
    });
}

function askForNotificationPermissions(){
    Notification.requestPermission(function(result){
        console.log("User Choice",result);
        if(result !=='granted'){
            console.log("No Notification Permission Granted!");
        }
        else{
            configurePushSub();
            //Hide Button
            //displayConfirmedNotifications();

        }
    });
}

if("Notification" in window){
    for(var i=0;i<enableNotificationsButtons.length;i++){
        enableNotificationsButtons[i].style.display = "inline-block";
        enableNotificationsButtons[i].addEventListener('click', askForNotificationPermissions);
    }
}

// //GET Request using Tradition AJAx (Synchronous) Cannot be used in SWs
// var xhr = new XMLHttpRequest();
// xhr.open("GET","https://httpbin.org/ip");
// xhr.responseType="json";
// xhr.onload = function(){
//     console.log(xhr.response);
// };
// xhr.onerror = function(){
//     console.log("Error!");
// };
// xhr.send();

// //Get Request Using Fetch API (Asynchronous) Used in SW
// fetch("https://httpbin.org/ip").then(function(response){
//     console.log(response);
//     return response.json();
// }).then(function(data){
//     console.log(data);
// }).catch(function(err){
//     console.log(err);
// });

// fetch("https://httpbin.org/post",{
//     method:"POST",
//     headers:{
//         "Content-Type":"application-json",
//         "Accept":"application-json"
//     },
//     mode:"cors",//use "no-cors" if Access-Control-Allow-Origin error occurs
//     body:JSON.stringify({
//         message:"Does this work?"
//     })
// }).then(function(response){
//     console.log(response);
//     return response.json();
// }).then(function(data){
//     console.log(data);
// }).catch(function(err){
//     console.log(err);
// });