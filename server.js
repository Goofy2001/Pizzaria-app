// importeren van ww
require('dotenv').config()

// loading the required packages from node.js and express
const express = require('express')
const app = express()
const path = require('path')
// defineer de localhost port
const port = process.env.PORT || 8000

//middleware: voor mij nog onbekend maar zal later miss duidelijk worden
app.use(express.urlencoded({extended: false}))


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

// put routes online
app.use('/api/about', about)
app.use('/api/echo', echo)
app.use('/api/branch', branch)
app.use('/api/orders', orders)
app.use('/api/drivers', drivers)

// put server online
app.listen(port, function() {console.log("server is running on port " + port)})