const { Server } = require('socket.io')
const testHandlers = require('./handlers/testHandlers')
const driverHandlers = require('./handlers/driverHandlers')

function initializeSocket(server) {
    const io = new Server(server)
    io.on('connection', function(socket) {
        console.log('Nieuwe client verbonden: ', socket.id)
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