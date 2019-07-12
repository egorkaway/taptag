const repo = require('./repository')

let showError = err => {
  console.log(err)
}

module.exports.next = function(userId) {
  return new Promise((resolve, reject) => {
    repo
      .getLastVoteByUser(userId)
      .then(lastVote => {
        if (lastVote.empty) {
          this.getLastImageForLastKey(userId).then(data => {
            resolve(data)
          })
          return
        } else {
          lastVote.forEach(vote => {
            repo
              .getImageById(vote.data().imageId)
              .then(prevImage => {
                if (prevImage.empty) {
                  this.getImageByNextKey(userId, vote.data().keyword).then(
                    data => {
                      resolve(data)
                    },
                  )
                  return
                }
                repo
                  .getImageByKeyAfter(vote.data().keyword, prevImage)
                  .then(images => {
                    if (images.empty) {
                      repo
                        .getKeyById(vote.data().keyword)
                        .then(prevKey => {
                          if (prevKey.empty) {
                            this.getImageByNextKey(
                              userId,
                              vote.data().keyword,
                            ).then(data => {
                              resolve(data)
                            })
                            return
                          }
                          repo
                            .getNotCompletedKeyAfter(prevKey)
                            .then(nextKeywords => {
                              if (nextKeywords.empty) {
                                this.getLastImageForLastKey(userId).then(
                                  data => {
                                    resolve(data)
                                  },
                                )
                                return
                              }

                              nextKeywords.forEach(nextKeyword => {
                                repo
                                  .getFirstImageByKey(nextKeyword.id)
                                  .then(nextimages => {
                                    if (nextimages.empty) {
                                      this.getLastImageForLastKey(userId).then(
                                        data => {
                                          resolve(data)
                                        },
                                      )
                                      return
                                    }

                                    nextimages.forEach(image => {
                                      repo
                                        .getUserVoteForImageByKey(
                                          image.id,
                                          nextKeyword.id,
                                          userId,
                                        )
                                        .then(userVote => {
                                          if (userVote.empty) {
                                            resolve({
                                              imageId: image.id,
                                              url: image.data().url,
                                              keyword: nextKeyword.id,
                                            })
                                            return
                                          } else {
                                            this.getImageByNextKey(
                                              userId,
                                              vote.data().keyword,
                                            ).then(data => {
                                              resolve(data)
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
                            })
                            .catch(showError)
                        })
                        .catch(showError)
                    }

                    images.forEach(image => {
                      repo
                        .getUserVoteForImageByKey(
                          image.id,
                          vote.data().keyword,
                          userId,
                        )
                        .then(userVote => {
                          if (userVote.empty) {
                            resolve({
                              imageId: image.id,
                              url: image.data().url,
                              keyword: vote.data().keyword,
                            })
                            return
                          } else {
                            this.getImageByNextKey(
                              userId,
                              vote.data().keyword,
                            ).then(data => {
                              resolve(data)
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
          })
        }
      })
      .catch(showError)
  })
}

module.exports.getNextImage = function(imageId, userId, keyword) {
  return new Promise((resolve, reject) => {
    repo
      .getImageById(imageId)
      .then(prevImage => {
        repo
          .getImageByKeyAfter(keyword, prevImage)
          .then(images => {
            if (images.empty) {
              this.getImageByNextKey(userId, keyword).then(data => {
                resolve(data)
              })
              return
            }
            images.forEach(image => {
              repo
                .getUserVoteForImageByKey(image.id, keyword, userId)
                .then(userVote => {
                  if (userVote.empty) {
                    resolve({
                      imageId: image.id,
                      url: image.data().url,
                      keyword: keyword,
                    })
                    return
                  } else {
                    this.getImageByNextKey(userId, keyword).then(data => {
                      resolve(data)
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
  })
}

module.exports.getImageByNextKey = function(userId, keyword) {
  return new Promise((resolve, reject) => {
    repo
      .getKeyById(keyword)
      .then(prevKey => {
        repo
          .getNotCompletedKeyAfter(prevKey)
          .then(nextKeywords => {
            if (nextKeywords.empty) {
              this.getLastImageForLastKey(userId).then(data => {
                resolve(data)
              })
              return
            }

            nextKeywords.forEach(nextKeyword => {
              repo
                .getFirstImageByKey(nextKeyword.id)
                .then(nextimages => {
                  if (nextimages.empty) {
                    this.getImageByNextKey(userId, nextKeyword.id).then(
                      data => {
                        resolve(data)
                      },
                    )
                    return
                  }

                  nextimages.forEach(image => {
                    repo
                      .getUserVoteForImageByKey(
                        image.id,
                        nextKeyword.id,
                        userId,
                      )
                      .then(userVote => {
                        if (userVote.empty) {
                          resolve({
                            imageId: image.id,
                            url: image.data().url,
                            keyword: nextKeyword.id,
                          })
                          return
                        } else {
                          this.getLastImageForLastKey(userId).then(data => {
                            resolve(data)
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
          })
          .catch(showError)
      })
      .catch(showError)
  })
}

module.exports.getLastImageForLastKey = function(userId) {
  return new Promise((resolve, reject) => {
    repo
      .getFirstNotCompletedKey()
      .then(keys => {
        if (keys.empty) {
          resolve({url: 'assets/notFound.jpg'})
          return
        }
        keys.forEach(key => {
          repo
            .getFirstImageByKey(key.id)
            .then(images => {
              if (images.empty) {
                resolve({url: 'assets/notFound.jpg'})
                return
              }
              images.forEach(image => {
                repo
                  .getUserVoteForImageByKey(image.id, key.id, userId)
                  .then(userVote => {
                    if (userVote.empty) {
                      resolve({
                        imageId: image.id,
                        url: image.data().url,
                        keyword: key.id,
                      })
                      return
                    } else {
                      resolve({url: 'assets/notFound.jpg'})
                      return
                    }
                  })
                  .catch(showError)
                return
              })
            })
            .catch(showError)
        })
      })
      .catch(showError)
  })
}
