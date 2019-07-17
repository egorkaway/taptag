let imageId = null
let userId = null
let keyword = null

firebase.auth().onAuthStateChanged(function(authUser) {
  if (authUser) {
    // firebase
    //   .auth()
    //   .currentUser.getIdToken()
    //   .then(idToken => {
    //     const csrfToken = getCookie('csrfToken')
    //     return postIdTokenToSessionLogin('/sessionLogin', idToken, csrfToken)
    //   })
    userId = authUser.uid
    next()
  } else {
    firebase.auth().signInAnonymously()
  }
})

let host = '/' //'https://europe-west1-taptag-info.cloudfunctions.net/app/'

function updateData(data) {
  imageId = data.imageId
  url = data.url
  keyword = data.keyword || ''

  document.getElementById('image').src = data.url
  document.getElementById('text').innerHTML =
    '<b>This image was tagged as: ' + keyword + '.</b><br> Do you agree?'

  document.getElementById('skip').disabled = false
  document.getElementById('yes').disabled = false
  document.getElementById('no').disabled = false
}

function clear() {
  document.getElementById('skip').disabled = true
  document.getElementById('yes').disabled = true
  document.getElementById('no').disabled = true
  document.getElementById('image').src = 'assets/loading.gif'
  document.getElementById('text').innerHTML = ''
}

function success(data, status) {
  updateData(data)
}

function next() {
  $.get(
    `${host}api/images/next`,
    {
      userId: userId,
    },
    success,
  )
}

function yes() {
  clear()
  $.post(
    `${host}api/votes/yes`,
    {
      userId: userId,
      imageId: imageId,
      keyword: keyword,
    },
    success,
  )
}

function no() {
  clear()
  $.post(
    `${host}api/votes/no`,
    {
      userId: userId,
      imageId: imageId,
      keyword: keyword,
    },
    success,
  )
}

function skip() {
  clear()
  $.post(
    `${host}api/votes/skip`,
    {
      userId: userId,
      imageId: imageId,
      keyword: keyword,
    },
    success,
  )
}

function error() {
  clear()

  $.post(
    `${host}api/images/remove`,
    {
      userId: userId,
      imageId: imageId,
      keyword: keyword,
    },
    success,
  )
}

clear()

document.getElementById('image').addEventListener('error', error, false)
document.getElementById('skip').addEventListener('click', skip, false)
document.getElementById('yes').addEventListener('click', yes, false)
document.getElementById('no').addEventListener('click', no, false)
