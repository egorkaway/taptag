const repo = require('../repository')
const service = require('../service')

const express = require('express')
const router = express.Router()

let showError = err => {
  console.log(err)
}

router.post('/', function(req, res, next) {
  var docData = req.body
  repo.addImage(docData)
  res.send(docData)
})

router.post('/remove', function(req, res, next) {
  let imageId = req.body.imageId
  let userId = req.body.userId
  let keyword = req.body.keyword

  repo.removeImage(imageId).then(x => {
    service.next(userId).then(data => {
      res.send(data)
    })
  })
})

router.get('/page', function(req, res) {
  let userId = req.query.userId
  let lastImageId = req.query.imageId
  if (!userId) return
  if (lastImageId) {
    let last = repo.getImageById(lastImageId).then(lastImage => {
      let paginate = repo
        .getImagesAfter(lastImage, 10, userId)
        .then(snapshot => {
          if (snapshot.empty) {
            res.send([])
            return
          }
          let images = []
          snapshot.forEach(el => {
            let image = el.data()
            image.id = el.id
            images.push(image)
          })

          res.send(images)
        })
        .catch(showError)
    })
  } else {
    let paginate = repo.getImages(10, userId).then(snapshot => {
      if (snapshot.empty) {
        res.send([])
        return
      }
      let images = []
      snapshot.forEach(el => {
        let image = el.data()
        image.id = el.id
        images.push(image)
      })

      res.send(images)
    })
  }
})

router.get('/next', function(req, res) {
  let userId = req.query.userId
  if (!userId) return

  service.next(userId).then(data => {
    res.send(data)
  })
})

module.exports = router
