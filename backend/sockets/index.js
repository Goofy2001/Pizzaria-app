const { Server } = require('socket.io')
const testHandlers = require('./handlers/testHandlers')
const driverHandlers = require('./handlers/driverHandlers')

// Create Socket.IO server and wire all real-time event handlers.
function initializeSocket(server) {
    const io = new Server(server, {
        cors: {
            origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim()) : true,
            methods: ['GET', 'POST']
        }
    })
    io.on('connection', function(socket) {
        console.log('Nieuwe client verbonden: ', socket.id)

        // Room subscription used to scope branch-related events.
        socket.on('join_vestiging', function(data) {
            const vestigingId = data && data.vestiging_id
            if (!vestigingId) { return }
            const roomName = `vestiging:${vestigingId}`
            socket.join(roomName)
            socket.emit('joined_vestiging', { room: roomName })
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

module.exports = initializeSocket;