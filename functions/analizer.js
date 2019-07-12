const db = require('./fb')
const cron = require('node-cron')
const request = require('request')
const querystring = require('querystring')
const FieldValue = require('firebase-admin').firestore.FieldValue

const username = '...'
const password = '...'
const auth =
  'Basic ' + Buffer.from(username + ':' + password).toString('base64')

const imagesRef = db.fb.collection('images')
const keywordsRef = db.fb.collection('keywords')

const hour = 60 * 60 * 1000
let startAfter = null

module.exports.startKeywords = function() {
  cron.schedule('*/5 * * * * *', function() {
    console.log(startAfter, new Date())
    if (startAfter > new Date()) return
    let ref = imagesRef
      .where('keywordsProcessed', '==', false)
      .limit(1)
      .get()
      .then(snapshot => {
        if (snapshot.empty) {
          console.log('No matching documents. keywordsProcessed')
          return
        }

        snapshot.forEach(doc => {
          imagesRef.doc(doc.id).set({keywordsProcessed: true}, {merge: true})
          let encodedUrl = querystring.escape(doc.data().url)
          console.log(encodedUrl)
          var options = {
            url: `https://api.everypixel.com/v1/keywords?url=${encodedUrl}&num_keywords=10`,
            headers: {
              'Content-Type': 'application/json',
              Authorization: auth,
            },
          }
          request(options, function(err, res, body) {
            if (err != null) {
              console.log(err)
              imagesRef
                .doc(doc.id)
                .set({keywordsProcessed: false}, {merge: true})
              return
            }
            let json = JSON.parse(body)
            if (json.status == 'error') {
              startAfter = new Date(new Date().getTime() + hour)
              console.log(json)
              imagesRef
                .doc(doc.id)
                .set({keywordsProcessed: false}, {merge: true})
            } else {
              let keywords = json.keywords.map(element => element.keyword)
              keywords.forEach(keyword => {
                let keywordRef = keywordsRef.doc(keyword)
                keywordRef
                  .get()
                  .then(doc => {
                    if (!doc.exists) {
                      keywordRef.set({
                        timestamp: FieldValue.serverTimestamp(),
                        completed: false,
                      })
                    } else {
                      keywordRef.update(
                        'timestamp',
                        FieldValue.serverTimestamp(),
                      )
                    }
                  })
                  .catch(err => {
                    console.log(err)
                  })
              })
              imagesRef
                .doc(doc.id)
                .set(
                  {keywords: keywords, timestamp: FieldValue.serverTimestamp()},
                  {merge: true},
                )
              imagesRef
                .doc(doc.id)
                .collection('everypixel')
                .doc('keywords')
                .set({list: json.keywords})
            }
          })
        })
      })
      .catch(err => {
        console.log('Error getting documents', err)
      })
  })
}

module.exports.startQuality = function() {
  cron.schedule('* * * * *', function() {
    if (startAfter > new Date()) return
    let ref = imagesRef
      .where('qualityProcessed', '==', false)
      .limit(1)
      .get()
      .then(snapshot => {
        if (snapshot.empty) {
          console.log('No matching documents. qualityProcessed')
          return
        }

        snapshot.forEach(doc => {
          imagesRef.doc(doc.id).set({qualityProcessed: true}, {merge: true})
          let encodedUrl = querystring.escape(doc.data().url)

          var optionsquality = {
            url: `https://api.everypixel.com/v1/quality?url=${encodedUrl}`,
            headers: {
              'Content-Type': 'application/json',
              Authorization: auth,
            },
          }
          request(optionsquality, function(err, res, body) {
            if (err != null) {
              imagesRef
                .doc(doc.id)
                .set({qualityProcessed: false}, {merge: true})
              return
            }
            let json = JSON.parse(body)
            if (json.status == 'error') {
              console.log(json)
              imagesRef
                .doc(doc.id)
                .set({qualityProcessed: false}, {merge: true})
            } else {
              imagesRef
                .doc(doc.id)
                .collection('everypixel')
                .doc('quality')
                .set({quality: json.quality})
            }
          })

          var optionsquality_ugc = {
            url: `https://api.everypixel.com/v1/quality_ugc?url=${encodedUrl}`,
            headers: {
              'Content-Type': 'application/json',
              Authorization: auth,
            },
          }
          request(optionsquality_ugc, function(err, res, body) {
            if (err != null) {
              imagesRef.doc(doc.id).set({state: 0}, {merge: true})
              return
            }
            let json = JSON.parse(body)
            if (json.status == 'error') {
              imagesRef.doc(doc.id).set({state: 0}, {merge: true})
            } else {
              imagesRef
                .doc(doc.id)
                .collection('everypixel')
                .doc('quality_ugc')
                .set({quality: json.quality})
            }
          })
        })
      })
      .catch(err => {
        console.log('Error getting documents', err)
      })
  })
}

module.exports.startQualityUgc = function() {
  cron.schedule('* * * * *', function() {
    if (startAfter > new Date()) return
    let ref = imagesRef
      .where('qualityUgcProcessed', '==', false)
      .limit(1)
      .get()
      .then(snapshot => {
        if (snapshot.empty) {
          console.log('No matching documents. qualityUgcProcessed')
          return
        }

        snapshot.forEach(doc => {
          imagesRef.doc(doc.id).set({qualityUgcProcessed: true}, {merge: true})
          let encodedUrl = querystring.escape(doc.data().url)

          var optionsquality_ugc = {
            url: `https://api.everypixel.com/v1/quality_ugc?url=${encodedUrl}`,
            headers: {
              'Content-Type': 'application/json',
              Authorization: auth,
            },
          }
          request(optionsquality_ugc, function(err, res, body) {
            if (err != null) {
              imagesRef
                .doc(doc.id)
                .set({qualityUgcProcessed: false}, {merge: true})
              return
            }
            let json = JSON.parse(body)
            if (json.status == 'error') {
              console.log(json)
              imagesRef
                .doc(doc.id)
                .set({qualityUgcProcessed: false}, {merge: true})
            } else {
              imagesRef
                .doc(doc.id)
                .collection('everypixel')
                .doc('quality_ugc')
                .set({quality: json.quality})
            }
          })
        })
      })
      .catch(err => {
        console.log('Error getting documents', err)
      })
  })
}
