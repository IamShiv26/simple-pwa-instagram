var shareImageButton = document.querySelector('#share-image-button');
var createPostArea = document.querySelector('#create-post');
var sharedMomentsArea = document.querySelector('#shared-moments');
var closeCreatePostModalButton = document.querySelector('#close-create-post-modal-btn');
var form = document.querySelector('form');
var titleInput = document.querySelector('#title');
var locationInput = document.querySelector('#location');

function openCreatePostModal() {
  //createPostArea.style.display = 'block';
  createPostArea.style.transform  = 'translateY(0)';
  if(deferredPrompt){
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(function(choiceResult){

      if(choiceResult.outcome=='dismissed'){
        console.log('User cancelled');
      }
      else{
        console.log("User consfirmed");
      }
    });
    deferredPrompt=null;
  }

  // if('serviceWorker' in navigator){
  //   navigator.serviceWorker.getRegistrations().then(function(registrations){
  //     for(var i = 0;i<registrations.length;i++){
  //       registrations[i].unregister();
  //     }
  //   })
  // }
}

function closeCreatePostModal() {
  //createPostArea.style.display = 'none';
  createPostArea.style.transform  = 'translateY(100vh)';
}

shareImageButton.addEventListener('click', openCreatePostModal);

closeCreatePostModalButton.addEventListener('click', closeCreatePostModal);


//Enables to cache on demand
// function onSaveButtonClicked(event){
//   if('caches' in window){
//     caches.open('user-requested').then(function(cache){
//       cache.add('https://httpbin.org/get');
//       cache.add('./src/images/sf-boat.jpg');
//     });
//   }
//   console.log("clciked");
// }

function clearCards(){
  while(sharedMomentsArea.hasChildNodes()){
    sharedMomentsArea.removeChild(sharedMomentsArea.lastChild);
  }
}

function createCard(data) {
  var cardWrapper = document.createElement('div');
  cardWrapper.className = 'shared-moment-card mdl-card mdl-shadow--2dp';
  var cardTitle = document.createElement('div');
  cardTitle.className = 'mdl-card__title';
  cardTitle.style.backgroundImage = 'url(' + data.image + ')';
  cardTitle.style.backgroundSize = 'cover';
  cardTitle.style.height = '180px';
  cardWrapper.appendChild(cardTitle);
  var cardTitleTextElement = document.createElement('h2');
  cardTitleTextElement.style.color="white";
  cardTitleTextElement.className = 'mdl-card__title-text';
  cardTitleTextElement.textContent = data.title;
  cardTitle.appendChild(cardTitleTextElement);
  var cardSupportingText = document.createElement('div');
  cardSupportingText.className = 'mdl-card__supporting-text';
  cardSupportingText.textContent = data.location;
  cardSupportingText.style.textAlign = 'center';
  // var cardSaveButton = document.createElement('button');
  // cardSaveButton.textContent="Save"; 
  // cardSaveButton.addEventListener('click', onSaveButtonClicked);
  // cardSupportingText.appendChild(cardSaveButton);
  cardWrapper.appendChild(cardSupportingText);
  componentHandler.upgradeElement(cardWrapper);
  sharedMomentsArea.appendChild(cardWrapper);
}

function updateUI(data){
  clearCards();
  for(var i =0;i<data.length;i++){
    createCard(data[i]);
  }
}

var url="https://pictureit-e41c1.firebaseio.com/posts.json";
var networkDataRecieved = false;

fetch(url).then(function(res) {
    return res.json();
  })
  .then(function(data) {
    networkDataRecieved=true;
    console.group("from web",data);
    var dataArray=[];
    for(var key in data){
        dataArray.push(data[key]);
    }
    updateUI(dataArray);
  });


if('indexedDB' in window){
  readAllData('posts').then(function(data){
    if(!networkDataRecieved){
      console.log('from cache',data);
      updateUI(data);
    }
  });
}

function sendData(){
  fetch(url,{
    method:"POST",
    headers:{
      "Content-Type":"application/json",
      "Accept":"application/json",
    },
    body : {
      id: new Date().toISOString(),
      title: titleInput.value,
      location:locationInput.value,
      image : 'https://firebasestorage.googleapis.com/v0/b/pictureit-e41c1.appspot.com/o/Marcus.png?alt=media&token=257a20c0-e6d2-4cc8-abb7-4a629049a265'
    }
  }).then(function(res){
    console.log("Sent Data",res);
  })
}

form.addEventListener('submit', function(){
  event.preventDefault();
  if(titleInput.value.trim() ==='' || locationInput.value.trim()===''){
    alert("Please enter data!")
    return;
  }

  closeCreatePostModal();

  if('serviceWorker' in navigator && 'SyncManager' in window){
      navigator.serviceWorker.ready.then(function(sw){
        var post={
          id: new Date().toISOString(),
          title: titleInput.value,
          location: locationInput.value
        };
        writeData('sync-posts',post).then(function(){
          sw.sync.register('sync-new-post');
        }).then(function(){
          var snackbarContainer = document.querySelector('#confirmation-toast');
          var data= {message : "Your post has been saved for syncing!"};
          snackbarContainer.MaterialSnackbar.showSnackbar(data);
        }).catch(function(err){
          console.log(err);
        }); 
      });
  }
  else{
      sendData();
  }
});