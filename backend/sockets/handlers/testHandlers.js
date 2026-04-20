// Counter variable (alleen voor test)
let counter = 0;

// Register simple example/test events for learning Socket.IO basics.
module.exports = function(io, socket) {
    
    // Broadcast naar iedereen dat er een nieuwe user is
    socket.broadcast.emit('user_connected', {
        id: socket.id, 
        time: new Date().toString()
    });

    // Hello event - input van client, antwoord van server
    socket.on('hello', function(data) {
        console.log('Ontvangen van client: ', data);
        socket.emit('hello_response', {
            message: 'Hallo van de server',
            timestamp: new Date()
        });
    });

    // Teller app
    socket.on('counter_increment', function() {
        counter++;
        console.log(`Nieuwe teller waarde: ${counter}`);
        io.emit('counter_update', counter);
    });

    // Ping-pong
    socket.on('ping', function() {
        console.log('Ping');
        socket.emit('pong');
    });

    // Server tijd vragen
    socket.on('serverTime', function() {
        console.log('Time asked from client');
        let tijd = new Date().toString();
        socket.emit('timeFromServer', tijd);
    });
};