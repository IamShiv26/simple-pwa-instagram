var deferredPrompt;

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