/**
 * SOCKET.IO INITIALIZATION
 * Doel: Setup Socket.IO server voor real-time communicatie
 */

//socket.io server importeren
const { Server } = require('socket.io')
//handlers importeren
const testHandlers = require('./handlers/testHandlers') 
const driverHandlers = require('./handlers/driverHandlers')

const defaultAllowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:8000',
    'http://localhost',
    'https://localhost',
    'capacitor://localhost',
    'ionic://localhost'
]

function getAllowedOrigins() {
    const envOrigins = process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean)
        : []

    return [...new Set([...defaultAllowedOrigins, ...envOrigins])]
}

// maak socket server en zet de functies online
function initializeSocket(server) {
    const io = new Server(server, {
        cors: {
            origin: getAllowedOrigins(),
            methods: ['GET', 'POST']
        }
    })
    //connectie maken met nieuwe client
    io.on('connection', function(socket) {
        //console.log voor debugging
        console.log('Nieuwe client verbonden: ', socket.id)
        //zet client in "room" gebaseerd op branch info van frontend
        socket.on('join_vestiging', function(data) {
            //error handling: wordt data meegestuurd en is vestiging_id er deel van
            console.log(data)
            const vestigingId = data && data.vestiging_id
            if (!vestigingId) { return }
            //maak een room op basis van de vestiging
            const roomName = `vestiging:${vestigingId}`
            //laat client de room joinen 
            socket.join(roomName)
            console.log('Client joined room:', roomName)
        })

        // Register handlers
        testHandlers(io, socket)
        driverHandlers(io, socket)
        // Disconnect
        socket.on('disconnect', function() {
            console.log('Client disconnected: ', socket.id)
        })
    })
    return io
}

module.exports = initializeSocket; //maak global