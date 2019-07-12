const express = require('express')
const router = express.Router()

const repo = require('../repository')
const service = require('../service')

let showError = err => {
  console.log(err)
}

router.post('/yes', function(req, res, next) {
  let imageId = req.body.imageId
  let userId = req.body.userId
  let keyword = req.body.keyword

  let vote = {
    uid: userId,
    imageId: imageId,
    keyword: keyword,
    type: 'yes',
  }
  repo.addVote(vote)
  service.getNextImage(imageId, userId, keyword).then(data => {
    res.send(data)
  })
})

router.post('/no', function(req, res, next) {
  let imageId = req.body.imageId
  let userId = req.body.userId
  let keyword = req.body.keyword

  let vote = {
    uid: userId,
    imageId: imageId,
    keyword: keyword,
    type: 'no',
  }
  repo.addVote(vote)
  service.getNextImage(imageId, userId, keyword).then(data => {
    res.send(data)
  })
})

router.post('/skip', function(req, res, next) {
  let imageId = req.body.imageId
  let userId = req.body.userId
  let keyword = req.body.keyword

  repo.getLastVoteByUser(userId).then(votes => {
    repo.addVote({
      uid: userId,
      imageId: imageId,
      keyword: keyword,
      type: 'skip',
    })
    if (votes.empty) {
      repo
        .getImageById(imageId)
        .then(prevImage => {
          repo
            .getImageByKeyAfter(keyword, prevImage)
            .then(images => {
              if (images.empty) {
                service.getImageByNextKey(userId, keyword).then(data => {
                  res.send(data)
                })
                return
              }
              images.forEach(image => {
                repo
                  .getUserVoteForImageByKey(image.id, keyword, userId)
                  .then(userVote => {
                    if (userVote.empty) {
                      res.send({
                        imageId: image.id,
                        url: image.data().url,
                        keyword: keyword,
                      })
                      return
                    } else {
                      service.getImageByNextKey(userId, keyword).then(data => {
                        res.send(data)
                      })
                      return
                    }
                  })
                  .catch(showError)
              })
              return
            })
            .catch(showError)
        })
        .catch(showError)
    } else {
      votes.forEach(vote => {
        if (vote.data().keyword == keyword && vote.data().type == 'skip') {
          service.getImageByNextKey(userId, keyword).then(data => {
            res.send(data)
          })
          return
        } else {
          repo
            .getImageById(imageId)
            .then(prevImage => {
              repo
                .getImageByKeyAfter(keyword, prevImage)
                .then(images => {
                  if (images.empty) {
                    service.getImageByNextKey(userId, keyword).then(data => {
                      res.send(data)
                    })
                    return
                  }
                  images.forEach(image => {
                    repo
                      .getUserVoteForImageByKey(image.id, keyword, userId)
                      .then(userVote => {
                        if (userVote.empty) {
                          res.send({
                            imageId: image.id,
                            url: image.data().url,
                            keyword: keyword,
                          })
                          return
                        } else {
                          service
                            .getImageByNextKey(userId, keyword)
                            .then(data => {
                              res.send(data)
                            })
                          return
                        }
                      })
                      .catch(showError)
                    return
                  })
                  return
                })
                .catch(showError)
            })
            .catch(showError)
        }
      })
    }
  })
})

module.exports = router
