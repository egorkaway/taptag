const functions = require('firebase-functions')
const admin = require('firebase-admin')
const analizer = require('./analizer')
const express = require('express')
const bodyParser = require('body-parser')
const votesRouter = require('./routes/votes')
const imagesRouter = require('./routes/images')
const repo = require('./repository')
const cors = require('cors')({origin: true})
const app = express()
const expiresIn = 60 * 60 * 24 * 5 * 1000

app.use(cors)
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

app.use('/api/votes', votesRouter)
app.use('/api/images', imagesRouter)

app.post('/sessionLogin', (req, res) => {
  const idToken = req.body.idToken.toString()
  const csrfToken = req.body.csrfToken.toString()
  if (csrfToken !== req.cookies.csrfToken) {
    res.status(401).send('UNAUTHORIZED REQUEST!')
    return
  }
  admin
    .auth()
    .createSessionCookie(idToken, {expiresIn})
    .then(
      sessionCookie => {
        const options = {maxAge: expiresIn, httpOnly: true, secure: true}
        res.cookie('session', sessionCookie, options)
        res.end(JSON.stringify({status: 'success'}))
      },
      error => {
        res.status(401).send('UNAUTHORIZED REQUEST!')
      },
    )
})

analizer.startKeywords()
analizer.startQuality()
analizer.startQualityUgc()

// exports.app = functions.region('europe-west1').https.onRequest(app)
exports.app = functions.https.onRequest(app)

exports.voting = functions.firestore
  .document('votes/{voteId}')
  .onCreate(repo.onVote)
