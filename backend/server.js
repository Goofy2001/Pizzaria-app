/**
 * ====================================================================
 * PIZZERIA APP - MAIN SERVER FILE
 * ====================================================================
 * Doel: Express.js server voor pizzeria dashboard applicatie
 * 
 * Dit bestand initaliseert:
 * - Express server met beveiligingsmiddleware
 * - HTTP server voor Socket.IO WebSocket verbindingen
 * - API routes voor drivers, orders, branches, analytics
 * - Rate limiting voor API bescherming
 * 
 * Libraries gebruikt:
 * - express: Web application framework
 * - helmet: Security HTTP headers
 * - cors: Cross-Origin Resource Sharing
 * - express-rate-limit: Rate limiting middleware
 * - socket.io: Real-time bidirectional communication
 * ====================================================================
 */

// Laden omgevingsvariabelen uit .env bestand
require('dotenv').config()

// Import core Node.js en Express packages
const express = require('express') // Web application framework
const http = require('http') // HTTP server module
const helmet = require('helmet') // Security middleware voor HTTP headers
const cors = require('cors') // Cross-origin resource sharing middleware
const rateLimit = require('express-rate-limit') // Rate limiting middleware
const app = express() // Maak Express applicatie instance
const server = http.createServer(app) // Maak HTTP server op basis van Express app
const path = require('path') // Path utilities module


/**
 * MIDDLEWARE CONFIGURATIE
 * Beveiligings-, CORS-, en request parsing middleware stack
 */

// Disable 'X-Powered-By' header voor veiligheid (verbergt dat dit Express is)
app.disable('x-powered-by')

// Helmet: zet diverse HTTP headers voor veiligheid
app.use(helmet())

// CORS: staat cross-origin requests toe van webbrowser
app.use(cors({
    // Accepteer origins uit env of alle origins als niet gespecificeerd
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim()) : true
}))

// Rate limiter configuratie: limit aantal requests per IP adres
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minuten timeout
    max: Number(process.env.RATE_LIMIT_MAX || 300), // max 300 requests per window
    standardHeaders: true, // Return rate limit info in RateLimit-* headers
    legacyHeaders: false, // Disable X-RateLimit-* headers
})

// Parse JSON request bodies
app.use(express.json())

// Parse URL-encoded request bodies (formulieren)
app.use(express.urlencoded({extended: false}))

// Serve statische bestanden uit public directory
app.use(express.static('public'))

// Pas rate limiter toe op /api routes
app.use('/api', apiLimiter)

/**
 * SOCKET.IO SETUP
 * Initialiseer WebSocket server voor real-time communicatie
 */
const initializeSocket = require('./sockets') // Import Socket.IO handler
const io = initializeSocket(server) // Initialiseer Socket.IO met http server
app.set('io', io) // Maak io beschikbaar in Express app context


/**
 * HEALTH CHECK ENDPOINTS
 * Test endpoints voor server status
 */

// Health check endpoint: retourneer status dat server online is
app.get('/health', function(req, res) {
    res.send({msg: 'Pizza-website staat online'})
})

// Testje: alleen in development mode (niet in productie)
if (process.env.NODE_ENV !== 'production') {
    app.get('/test', function(req, res) {
        res.json({
            message: 'Dit is een json test',
            timeStamp: new Date()
        })
    })
}

/**
 * ROUTE IMPORTS
 * Import alle API route handlers
 */
const about = require('./routes/about') // About/informatie routes
const echo = require('./routes/echo') // Echo/test routes
const authentication = require('./routes/authentication') // Login/logout routes
const branch = require('./routes/branch') // Branch/vestiging routes
const orders = require('./routes/orders') // Order/bestelling routes
const drivers = require('./routes/drivers') // Driver/chauffeur routes
const analytics = require('./routes/analytics') // Analytics/statistieken routes

/**
 * ROUTE REGISTRATIE
 * Registreer elke router op entsprechende API path
 * Elk bestand handelt zijn eigen endpoints af
 */
app.use('/api/about', about) // /api/about/* endpoints
app.use('/api/echo', echo) // /api/echo/* endpoints
app.use('/api/auth', authentication) // /api/auth/login, /api/auth/logout
app.use('/api/branch', branch) // /api/branch/* endpoints
app.use('/api/orders', orders(io)) // /api/orders/* endpoints (met Socket.IO access)
app.use('/api/drivers', drivers) // /api/drivers/* endpoints
app.use('/api/analytics', analytics) // /api/analytics/* endpoints


/**
 * SERVER START
 * zet server online op gespecificeerde poort
 */

// Verkrijg poort uit environment variable of default 8000
const port = process.env.PORT || 8000

// Start HTTP server en luister op poort
server.listen(port, function() { 
    console.log("server is running on port " + port) 
})