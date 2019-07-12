const db = require('./fb')
const FieldValue = require('firebase-admin').firestore.FieldValue

const keywordsRef = db.fb.collection('keywords')
const votesRef = db.fb.collection('votes')
const imagesRef = db.fb.collection('images')
const countersRef = db.fb.collection('counters')

module.exports.onVote = vote => {
  return new Promise((resolve, reject) => {
    if (vote.type == 'yes' || vote.type == 'no') {
      let counterRef = countersRef.doc(`${vote.keyword}_${vote.imageId}`)

      var counter = {
        keyword: vote.keyword,
        imageId: vote.imageId,
        completed: false,
        yes: 0,
        no: 0,
      }

      this.getThreeVoteForImageByKey(vote.imageId, vote.keyword).then(votes => {
        if (votes.size == 3) {
          counterRef
            .get()
            .then(doc => {
              console.log(doc.data())
              if (!doc.exists) {
                counter[vote.type] = counter[vote.type] + 1
                counterRef.set(counter).then(x => {
                  resolve(1)
                })
              } else {
                var update = {}
                update[vote.type] = FieldValue.increment(1)
                var counterData = doc.data()
                counterData[vote.type] = counterData[vote.type] + 1
                if (counterData.yes * 9 < counterData.no) {
                  update.completed = true
                }
                if (counterData.no * 9 < counterData.yes) {
                  update.completed = true
                }
                counterRef.set(update, {merge: true}).then(x => {
                  if (update.completed) {
                    this.removeImageKey(vote.imageId, vote.keyword).then(x => {
                      this.onImageComplete(vote.keyword, vote.type).then(c => {
                        resolve(1)
                      })
                    })
                  } else {
                    resolve(1)
                  }
                })
              }
            })
            .catch(err => {
              console.log(err)
            })
        } else if (votes.size == 2) {
          var allSame = true
          votes.forEach(voted => {
            allSame = allSame && voted.data().type == vote.type
          })
          if (allSame) {
            var update = {completed: true}
            update[vote.type] = FieldValue.increment(1)
            counterRef.set(update, {merge: true}).then(x => {
              this.removeImageKey(vote.imageId, vote.keyword).then(x => {
                this.onImageComplete(vote.keyword, vote.type).then(c => {
                  resolve(1)
                })
              })
            })
          } else {
            counterRef
              .get()
              .then(doc => {
                if (!doc.exists) {
                  counter[vote.type] = counter[vote.type] + 1
                  counterRef.set(counter).then(x => {
                    resolve(1)
                  })
                } else {
                  var update = {}
                  update[vote.type] = FieldValue.increment(1)
                  counterRef.set(update, {merge: true}).then(x => {
                    resolve(1)
                  })
                }
              })
              .catch(err => {
                console.log(err)
              })
          }
        } else if (votes.size == 1) {
          counterRef
            .get()
            .then(doc => {
              if (!doc.exists) {
                counter[vote.type] = counter[vote.type] + 1
                counterRef.set(counter).then(x => {
                  resolve(1)
                })
              } else {
                var update = {}
                update[vote.type] = FieldValue.increment(1)
                counterRef.set(update, {merge: true}).then(x => {
                  resolve(1)
                })
              }
            })
            .catch(err => {
              console.log(err)
            })
        } else {
          counter[vote.type] = counter[vote.type] + 1
          counterRef.set(counter).then(x => {
            resolve(1)
          })
        }
      })
    }
  })
}

module.exports.onImageComplete = (keyword, type) => {
  return new Promise((resolve, reject) => {
    let counterRef = countersRef.doc(keyword)
    counterRef.get().then(counter => {
      if (counter.empty) {
        let newDoc = {
          yes: 0,
          no: 0,
          completed: false,
        }
        newDoc[type] = newDoc[type] + 1
        counterRef.set(newDoc).then(x => resolve(1))
      } else {
        let data = counter.data()
        data[type] = data[type] + 1
        if (data.yes == 1000 && data.no == 1000) {
          data.completed = true
          counterRef.set(data, {merge: true}).then(x => resolve(1))
        } else {
          counterRef.update(type, FieldValue.increment(1)).then(x => resolve(1))
        }
      }
    })
  })
}

module.exports.getKeyById = id => {
  return keywordsRef.doc(id).get()
}

module.exports.getFirstNotCompletedKey = () => {
  return keywordsRef
    .orderBy('timestamp', 'desc')
    .where('completed', '==', false)
    .limit(1)
    .get()
}

module.exports.getNotCompletedKeyAfter = key => {
  return keywordsRef
    .orderBy('timestamp', 'desc')
    .where('completed', '==', false)
    .startAfter(key)
    .limit(1)
    .get()
}

module.exports.getLastVoteForKeyByUser = (keywordId, userId) => {
  return votesRef
    .orderBy('timestamp', 'desc')
    .where('keyword', '==', keywordId)
    .where('uid', '==', userId)
    .limit(1)
    .get()
}

module.exports.getLastVoteByUser = userId => {
  return votesRef
    .orderBy('timestamp', 'desc')
    .where('uid', '==', userId)
    .limit(1)
    .get()
}

module.exports.getLastTwoVotesForImage = imageId => {
  return votesRef
    .orderBy('timestamp', 'desc')
    .where('imageId', '==', imageId)
    .limit(2)
    .get()
}

module.exports.getLastThreeVotesForImageByKey = (imageId, key) => {
  return votesRef
    .orderBy('timestamp', 'desc')
    .where('imageId', '==', imageId)
    .where('keyword', '==', key)
    .limit(3)
    .get()
}

module.exports.getImageById = id => {
  return imagesRef.doc(id).get()
}

module.exports.getImageByKeyAfter = (key, image) => {
  return imagesRef
    .orderBy('timestamp', 'desc')
    .where('keywords', 'array-contains', key)
    .startAfter(image)
    .limit(1)
    .get()
}

module.exports.getImagesAfter = (image, limit, userId) => {
  return imagesRef
    .orderBy('timestamp')
    .where('userId', '==', userId)
    .startAfter(image)
    .limit(limit)
    .get()
}

module.exports.getImages = (limit, userId) => {
  return imagesRef
    .orderBy('timestamp')
    .where('userId', '==', userId)
    .limit(limit)
    .get()
}

module.exports.getFirstImageByKey = key => {
  return imagesRef
    .orderBy('timestamp', 'desc')
    .where('keywords', 'array-contains', key)
    .limit(1)
    .get()
}

module.exports.addImage = data => {
  data.timestamp = FieldValue.serverTimestamp()
  data.completed = false
  data.keywordsProcessed = false
  data.qualityUgcProcessed = false
  data.qualityProcessed = false
  return imagesRef.add(data)
}

module.exports.removeImage = id => {
  return imagesRef.doc(id).delete()
}

module.exports.updateImage = (id, data) => {
  return imagesRef.doc(id).set(data, {merge: true})
}

module.exports.addVote = data => {
  data.timestamp = FieldValue.serverTimestamp()
  return votesRef.add(data)
}

module.exports.getUserVoteForImageByKey = (imageId, key, userId) => {
  return votesRef
    .where('imageId', '==', imageId)
    .where('keyword', '==', key)
    .where('userId', '==', userId)
    .limit(1)
    .get()
}

module.exports.getThreeVoteForImageByKey = (imageId, keyword) => {
  return votesRef
    .orderBy('timestamp', 'desc')
    .where('imageId', '==', imageId)
    .where('keyword', '==', keyword)
    .limit(3)
    .get()
}

module.exports.removeImageKey = (imageId, keyword) => {
  return this.getImageById(imageId).then(image => {
    if (!image.empty) {
      let keywords = image.data().keywords
      var index = keywords.indexOf(keyword)
      if (index !== -1) {
        image.keywords.splice(index, 1)
        return imagesRef.doc(imageId).update('keywords', keywords)
      }
    }
  })
}
