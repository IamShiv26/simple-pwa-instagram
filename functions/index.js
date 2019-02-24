
var functions = require('firebase-functions');
var admin = require('firebase-admin');
var cors = require('cors')({origin: true});
var webpush = require('web-push');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//

var serviceAccount = require("./private-key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://pictureit-e41c1.firebaseio.com/'
});

exports.storePostData = functions.https.onRequest(function(request, response) {
 cors(request, response, function() {
   admin.database().ref('posts').push({
     id: request.body.id,
     title: request.body.title,
     location: request.body.location,
     image: request.body.image
   })
     .then(function() {
       webpush.setVapidDetails('mailto:shivashish.j@somaiya.edu','BO9DWoUGSfjJkhnJ5Lr3NDl1jU2LEolehLU0apycf3wEG3LYZ5Qzw0xGySlNQnlBbLBNtIfeIHdp1C1CnlxTQ2g','Im_C_-O5XnQAVTNFrAyt1zlnK-2tLpH5F7HQBgXoI7c');
       return admin.database().ref('subscriptions').once('value');
     })
     .then(function(subscriptions){
       subscriptions.forEach(function(sub){
         //sub holds endpoint and keys
         var pushConfig = {
            endpoint: sub.val().endpoint,
            keys: {
              auth:sub.val().keys.auth,
              p256dh:sub.val().keys.p256dh
            }
         };
         webpush.sendNotification(pushConfig,JSON.stringify(
           {
             title:"New Post!!", 
           content:"New Post Added!",
           openURL : 'https://pictureit-e41c1.firebaseapp.com/'
          }
           ))
         .catch(function(err){
           console.log(err);
         });
       });
      response.status(201).json({message: 'Data stored', id: request.body.id});
     })
     .catch(function(err) {
       response.status(500).json({error: err});
     });
 });
});
