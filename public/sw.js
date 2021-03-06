
importScripts('/src/js/idb.js');
importScripts('/src/js/utility.js');

var CACHE_STATIC = "static-v66";
var CACHE_DYNAMIC = "dynamic-v3";
var STATIC_ARRAY = [
    '/',
'/index.html',
'/offline.html',
'/src/js/app.js',
'/src/js/feed.js',
'/src/js/promise.js',
'/src/js/fetch.js',
'/src/js/idb.js',
'/src/js/material.min.js',
'/src/css/app.css',
'/src/css/feed.css',
'/src/images/main-image.jpg',
'https://fonts.googleapis.com/css?family=Roboto:400,700',
'https://fonts.googleapis.com/icon?family=Material+Icons',
'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css'
];


// function trimCache(cacheName,maxItems){
//     caches.open(CACHE_DYNAMIC).then(function(cache){
//         return cache.keys().then(function(keys){
//             if(keys.length>maxItems){
//                 cache.delete(keys[0]).then(trimCache(cacheName,maxItems));
//             }
//         });
//     })
// }

self.addEventListener('install',function(event){
    console.log("[Service Worker] Installing Service Worker...",event);
    event.waitUntil(
        caches.open(CACHE_STATIC).then(function(cache){
            console.log("[Service Worker] Prechaching App Shell...");
            cache.addAll(STATIC_ARRAY);
        })
    )
});
self.addEventListener('activate',function(event){
    console.log("[Service Worker] Activating Service Worker...",event);
    event.waitUntil(
        caches.keys()
            .then(function(key_list){
                return Promise.all(key_list.map(function(key){
                    if(key!== CACHE_STATIC && key!==CACHE_DYNAMIC){
                        console.log("[Service Worker] Removing old cache...");
                        return caches.delete(key);
                    }
                }));
            })
    );
    return self.clients.claim();
});

function isInArray(string,array){
    for(var i=0;i<array.length;i++){
        if(string===array[i]){
            return true;
        }
    }
    return false;
}

self.addEventListener('fetch', function(event){
    //console.log("[Service Worker] Fetching....",event);
    var url="https://pictureit-e41c1.firebaseio.com/posts";
    if(event.request.url.indexOf(url)>-1){
    event.respondWith(fetch(event.request).then(function(res){
        var clonedRes = res.clone();
        clearAllData('posts').then(function(){
            return clonedRes.json();
        }).then(function(data){
                for(var key in data){
                    writeData('posts',data[key]);
                }
                });
        return res;
        })
    );
    }else if(isInArray(event.request.url,STATIC_ARRAY)){
        //Cache Only Approach For Static Cache
        event.respondWith(
            caches.match(event.request)
        );
    }else{
        event.respondWith(
            caches.match(event.request).then(function(response){
                if(response){
                    return response;
                }
                else{
                    return fetch(event.request).then(function(res){
                        return caches.open(CACHE_DYNAMIC).then(function(cache){
                            //trimCache(CACHE_DYNAMIC,4);
                            cache.put(event.request.url,res.clone());
                            return res;
                        })
                    }).catch(function(err){
                        return caches.open(CACHE_STATIC).then(function(cache){
                            if(event.request.headers.get('accept').includes('text/html')){//Can be used for fallbacking any file and not just html files(eg. images)
                            return cache.match('/offline.html');
                            }
                        });
                    });
                }
            })
        );
    }
});

// self.addEventListener('fetch', function(event){
//     //console.log("[Service Worker] Fetching....",event);
//     event.respondWith(
//         caches.match(event.request).then(function(response){
//             if(response){
//                 return response;
//             }
//             else{
//                 return fetch(event.request).then(function(res){
//                     return caches.open(CACHE_DYNAMIC).then(function(cache){
//                         cache.put(event.request.url,res.clone());
//                         return res;
//                     })
//                 }).catch(function(err){
//                     return caches.open(CACHE_STATIC).then(function(cache){
//                         return cache.match('/offline.html');
//                     });
//                 });
//             }
//         })
//     );
// });

self.addEventListener('sync', function(event){
    console.log("[Service Worker] Background Syncing....",event);
    if(event.tag === 'sync-new-post'){
        console.log("[Service Worker] Syncing new posts...");
        event.waitUntil(
            readAllData('sync-posts').then(function(data){
                for(var dt of data){
                    fetch("https://us-central1-pictureit-e41c1.cloudfunctions.net/storePostData",{
                        method:"POST",
                        headers:{
                          "Content-Type":"application/json",
                          "Accept":"application/json"
                        },
                        body : JSON.stringify({
                          id: dt.id,
                          title: dt.title,
                          location:dt.location,
                          image : 'https://firebasestorage.googleapis.com/v0/b/pictureit-e41c1.appspot.com/o/Marcus.png?alt=media&token=257a20c0-e6d2-4cc8-abb7-4a629049a265'
                        })
                      }).then(function(res){
                        console.log("Sent Data",res);
                        if(res.ok){
                            res.json().then(function(resData){
                                deleteSingleItem('sync-posts',resData.id);
                            });
                        }
                      }).catch(function(err){
                          console.log("Error while sending data!",err);
                      });
                }
            })
        );
    }
});

self.addEventListener('notificationclick', function(event){
    var notification = event.notification;
    var action = event.action;
    
    console.log(notification);

    if(action=='confirm'){
        console.log("Confirm was chosen!");
        notification.close();
    }else{
        console.log(action);
        event.waitUntil(
            clients.matchAll()
            .then(function(clis){
                var client = clis.find(function(c){
                    return c.visibilityState === "visible";
                });

                if(client !== undefined){
                    client.navigate(notification.data.url);
                    client.focus();
                }
                else{
                    clients.openWindow(notification.data.url); 
                }
                notification.close();
            })
        );
    }
});

self.addEventListener('notificationclose',function(event){
    console.log("Notification was closed!!",event);
});

self.addEventListener('push',function(event){
    console.log("Push Notification Received",event);
    data = {
        title:"New",
        content:"Some New!",
        openURL:"https://pictureit-e41c1.firebaseapp.com/help"
    };
    if(event.data){
        data = JSON.parse(event.data.text());
    }

    var options = {
        body : data.content,
        icon:'/src/images/icons/app-icon-96x96.png',
        badge:'/src/images/icons/app-icon-96x96.png',
        data:{
            url:data.openURL
        }
    };

    event.waitUntil(
        self.registration.showNotification(data.title,options)
    );
});