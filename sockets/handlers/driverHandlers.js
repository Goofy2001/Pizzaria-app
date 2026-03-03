const pool = require('../../configs/database')

module.exports = function(io, socket) {
    //Events from driver
    // driver logt in op app met naam --> status online
    
    // driver locatie updates 

    // driver start met delivery
    socket.on('driver:start_delivery', async function(data) {
        try {
            const { bestelling_id, driver_id} = data
            console.log(`Driver ${driver_id} start bestelling ${bestelling_id}`)
            // updaten van de bestelling naar on_route
            const query1 = `
                UPDATE orders
                    SET status = 'on_route', delivery_started = NOW()
                    WHERE id = $1`
            await pool.query(query1, [bestelling_id])
            // ophalen van de bestelling
            const query2 = `
                SELECT o.*, b.name as branch_name, d.name as driver_name 
                FROM orders o
                    JOIN branch b ON o.branch_id = b.id
                    JOIN drivers d ON o.driver_id = d.id
                WHERE o.id = $1`
            const result = await pool.query(query2, [bestelling_id])
            const order = result.rows[0]
            // broadcast naar clients
            io.emit('order:status_changed', {order_id: bestelling_id, status: 'on_route', bestelling: order, timestamp: new Date()})
            // stuur bevestiging naar driver
            socket.emit('driver:delivery_started', {succes: true, order_id: bestelling_id, message: 'Delivery gestart!'})

        } catch(err) {
            console.error('Fout bij starten delivery:', err);
            socket.emit('error', { message: 'Database fout' })
        }
    })
    // driver stopt met delivery
    socket.on('driver:end_delivery', async function(data) {
        try {
            const { bestelling_id, driver_id } = data
            console.log(`Driver ${driver_id} eindigd bestelling ${bestelling_id}`)
            // updaten van de bestelling naar delivered
            const query1 = `
                UPDATE orders
                    SET status = 'delivered', delivery_delivered = NOW()
                    WHERE id = $1`
            await pool.query(query1, [bestelling_id])
            // ophalen van de bestelling
            const query2 = `
                SELECT o.*, b.name as branch_name, d.name as driver_name 
                FROM orders o
                    JOIN branch b ON o.branch_id = b.id
                    JOIN drivers d ON o.driver_id = d.id
                WHERE o.id = $1`
            const result = await pool.query(query2, [bestelling_id])
            const order = result.rows[0]
                  // broadcast naar clients
            io.emit('order:status_changed', {order_id: bestelling_id, status: 'delivered', bestelling: order, timestamp: new Date()})
            // stuur bevestiging naar driver
            socket.emit('driver:delivery_ended', {succes: true, order_id: bestelling_id, message: 'Delivery beëindigd!'})
        
        } catch(err) {
            console.error('Fout bij eindigen van delivery:', err);
            socket.emit('error', { message: 'Database fout' })
        }
    })
    // driver logt uit --> status offline

    //Events to driver
    // driver krijgt bestelling, max 2

    // driver krijgt route
}