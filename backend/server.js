// importeren van ww
require('dotenv').config()

// loading the required packages from node.js and express
const express = require('express')
const http = require('http')
const helmet = require('helmet')
const cors = require('cors')
const rateLimit = require('express-rate-limit')
const app = express()
const server = http.createServer(app) // http server maken
const path = require('path')



//middleware: voor mij nog onbekend maar zal later miss duidelijk worden
// Security + CORS + request parsing middleware stack.
app.disable('x-powered-by')
app.use(helmet())
app.use(cors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim()) : true
}))

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: Number(process.env.RATE_LIMIT_MAX || 300),
    standardHeaders: true,
    legacyHeaders: false
})

app.use(express.json())
app.use(express.urlencoded({extended: false}))
app.use(express.static('public'))
app.use('/api', apiLimiter)

// socket.IO setup
const initializeSocket = require('./sockets')
const io = initializeSocket(server)
app.set('io', io)

//TEST
app.get('/health', function(req, res) {
    res.send({msg: 'Pizza-website staat online'})
})

if (process.env.NODE_ENV !== 'production') {
    app.get('/test', function(req, res) {
        res.json({
            message: 'Dit is een json test',
            timeStamp: new Date()
        })
    })
}

// import routes
const about = require('./routes/about')
const echo = require('./routes/echo')
const authentication = require('./routes/authentication')
const branch = require('./routes/branch')
const orders = require('./routes/orders')
const drivers = require('./routes/drivers')
const analytics = require('./routes/analytics')

// put routes online
// Route registration: each router handles its own API endpoints.
app.use('/api/about', about)
app.use('/api/echo', echo)
app.use('/api/auth', authentication)
app.use('/api/branch', branch)
app.use('/api/orders', orders(io))
app.use('/api/drivers', drivers)
app.use('/api/analytics', analytics)



// definieer de localhost port
const port = process.env.PORT || 8000

// put server online
server.listen(port, '0.0.0.0', function() { console.log("server is running on port " + port) })