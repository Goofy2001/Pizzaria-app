// importeren van ww
require('dotenv').config()

// loading the required packages from node.js and express
const express = require('express')
const http = require('http')
const app = express()
const server = http.createServer(app) // http server maken
const path = require('path')



//middleware: voor mij nog onbekend maar zal later miss duidelijk worden
app.use(express.json())
app.use(express.urlencoded({extended: false}))
app.use(express.static('public'))


//TEST
app.get('/', function(req, res) {
    res.send({msg: "Pizza-website staat online"})
})

app.get('/test', function(req, res) {
    res.json({
        message: 'Dit is een json test',
        timeStamp: new Date()
    })
})

// import routes
const about = require('./routes/about')
const echo = require('./routes/echo')
const branch = require('./routes/branch')
const orders = require('./routes/orders')
const drivers = require('./routes/drivers')
const analytics = require('./routes/analytics')

// put routes online
app.use('/api/about', about)
app.use('/api/echo', echo)
app.use('/api/branch', branch)
app.use('/api/orders', orders)
app.use('/api/drivers', drivers)
app.use('/api/analytics', analytics)

// socket.IO setup
const initializeSocket = require('./sockets')
const io = initializeSocket(server)
app.set('io', io)

// definieer de localhost port
const port = process.env.PORT || 8000

// put server online
server.listen(port, function() {console.log("server is running on port " + port)})