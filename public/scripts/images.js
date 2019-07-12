let imageId = null
let userId = null
let loading = false
let counter = 0

let host = '/' //'https://europe-west1-taptag-info.cloudfunctions.net/app/'

function next() {
  loading = true
  $.get(
    `${host}api/images/page`,
    {
      userId: userId,
      imageId: imageId,
    },
    function(data, status) {
      data.forEach(el => add(el))
      if (data.length > 0) {
        imageId = data[data.length - 1].id
      }
      loading = false
    },
  )
}

function remove(img) {
  var imageId = img.id
  var dialog = document.querySelector('dialog')
  var notification = document.querySelector('.mdl-js-snackbar')
  if (!dialog.showModal) {
    $.post(
      `${host}api/images/remove`,
      {
        imageId: imageId,
      },
      function(data, status) {
        if (status == 'success') {
          let elem = document.getElementById('container' + imageId)
          elem.parentNode.removeChild(elem)
          notification.MaterialSnackbar.showSnackbar({
            message: `Deleted`,
          })
        }
      },
    )
  } else {
    dialog.showModal()
    dialog.querySelector('.close').addEventListener('click', function() {
      dialog.close()
    })
    dialog.querySelector('.agree').addEventListener('click', function() {
      $.post(
        `${host}api/images/remove`,
        {
          imageId: imageId,
        },
        function(data, status) {
          if (status == 'success') {
            let elem = document.getElementById('container' + imageId)
            elem.parentNode.removeChild(elem)
            notification.MaterialSnackbar.showSnackbar({
              message: `Deleted`,
            })
          }
        },
      )
      dialog.close()
    })
  }
}

function add(item) {
  let col = counter++ % 4
  var div = document.createElement('div')
  div.setAttribute('class', 'mdl-card mdl-shadow--2dp')
  div.setAttribute('id', `container${item.id}`)
  div.innerHTML = `<img src='${item.url}' />
    <div class="mdl-card__menu">
      <button id='${
        item.id
      }' class="mdl-button mdl-button--icon mdl-js-button mdl-js-ripple-effect mdl-button--fab mdl-button--mini-fab" onClick="remove(this)">
        <i class="material-icons">delete</i>
      </button>
    </div>`
  document.getElementById('col' + col).appendChild(div)
}

firebase.auth().onAuthStateChanged(function(authUser) {
  if (authUser) {
    userId = authUser.uid
    next()
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

let listElm = document.getElementById('main')
listElm.addEventListener('scroll', function() {
  if (listElm.scrollTop + listElm.clientHeight >= listElm.scrollHeight) {
    if (!loading) {
      next()
    }
  }
})
