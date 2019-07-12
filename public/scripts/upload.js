var storageRef = firebase.storage().ref()

firebase.auth().onAuthStateChanged(function(authUser) {
  if (authUser) {
    userId = authUser.uid
  } else {
    firebase.auth().signInAnonymously()
    // .then(user => {
    //   return user.getIdToken().then(idToken => {
    //     const csrfToken = getCookie('csrfToken')
    //     return postIdTokenToSessionLogin('/sessionLogin', idToken, csrfToken)
    //   })
    // })
  }
})

let host = '/' //'https://europe-west1-taptag-info.cloudfunctions.net/app/'

const maxSize = 20971520
const minSide = 700
const bucketName = 'images'
let counter = 0

function handleFileSelect(evt) {
  evt.stopPropagation()
  evt.preventDefault()
  counter = 0
  if (!evt.target.files.length) return

  upload(evt.target.files)
}

function upload(files) {
  if (counter > files.length - 1) return
  let file = files[counter]
  counter++
  var notification = document.querySelector('.mdl-js-snackbar')
  if (file.size > maxSize) {
    notification.MaterialSnackbar.showSnackbar({
      message: 'Error. Too large image',
    })
    return
  }

  document.getElementById('p1').MaterialProgress.setProgress(0)
  // var url = URL.createObjectURL(file)
  // var img = new Image()
  // img.onload = function() {
  // console.log(img.width, img.height)
  // if (img.width < minSide || img.height < minSide) return

  var user = firebase.auth().currentUser
  var metadata = {
    contentType: file.type,
    customMetadata: {
      userId: user.uid,
    },
  }
  let fileName = `${file.name}-${user.uid}-${new Date().getTime()}`
  var uploadTask = storageRef
    .child(`${bucketName}/${fileName}`)
    .put(file, metadata)

  uploadTask.on(
    'state_changed',
    function(snapshot) {
      var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
      document.getElementById('p1').MaterialProgress.setProgress(progress)
    },
    function(error) {
      notification.MaterialSnackbar.showSnackbar({
        message: 'Error',
      })
    },
    function() {
      uploadTask.snapshot.ref.getDownloadURL().then(function(downloadURL) {
        $.post(
          `${host}api/images`,
          {
            userId: user.uid,
            fileName: fileName,
            url: downloadURL,
          },
          function(data, status) {
            notification.MaterialSnackbar.showSnackbar({
              message: `Done ${counter}/${files.length}`,
            })
            upload(files)
          },
        )
      })
    },
  )
  // }
  // img.src = url
}

document
  .getElementById('file')
  .addEventListener('change', handleFileSelect, false)

document
  .getElementById('p1')
  .addEventListener('mdl-componentupgraded', function() {
    this.MaterialProgress.setProgress(0)
    self.mdlProgressInitDone = true
  })
