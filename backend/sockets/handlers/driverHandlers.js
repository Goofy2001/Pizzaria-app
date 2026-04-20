const pool = require('../../configs/database')
const ACTIVE_DELIVERY_STATUSES = ['loaded_for_delivery', 'on_route']

// Register real-time delivery events for drivers.
module.exports = function(io, socket) {
    // Helper: check if driver already has an active delivery.
    async function getActiveDeliveryForDriver(driverId, excludeOrderId = null) {
        const query = `
            SELECT id, status
            FROM orders
            WHERE driver_id = $1
              AND status = ANY($2::text[])
              AND ($3::int IS NULL OR id <> $3)
            ORDER BY created DESC
            LIMIT 1`
        const result = await pool.query(query, [driverId, ACTIVE_DELIVERY_STATUSES, excludeOrderId])
        return result.rows[0] || null
    }

    // Shared status update flow used by start/end/completed events.
    async function updateDeliveryStatus(data, nextStatus, timestampColumn, successEvent, successMessage) {
        const { bestelling_id, driver_id } = data || {}
        if (!bestelling_id || !driver_id) {
            socket.emit('error', { message: 'bestelling_id en driver_id zijn verplicht' })
            return
        }

        const orderResult = await pool.query('SELECT * FROM orders WHERE id = $1', [bestelling_id])
        if (orderResult.rows.length === 0) {
            socket.emit('error', { message: `Bestelling ${bestelling_id} niet gevonden` })
            return
        }

        const order = orderResult.rows[0]
        const previousStatus = order.status
        if (Number(order.driver_id) !== Number(driver_id)) {
            socket.emit('error', { message: `Driver ${driver_id} hoort niet bij bestelling ${bestelling_id}` })
            return
        }

        if (nextStatus === 'on_route') {
            const activeOrder = await getActiveDeliveryForDriver(driver_id, Number(bestelling_id))
            if (activeOrder) {
                socket.emit('error', {
                    message: `Driver ${driver_id} heeft al een actieve levering (order ${activeOrder.id}, status ${activeOrder.status})`
                })
                return
            }
        }

        const updateQuery = `
            UPDATE orders
                SET status = $1, ${timestampColumn} = NOW()
                WHERE id = $2
                RETURNING *`
        await pool.query(updateQuery, [nextStatus, bestelling_id])

        const selectQuery = `
            SELECT o.*, b.name as branch_name, d.name as driver_name
            FROM orders o
                JOIN branch b ON o.branch_id = b.id
                JOIN drivers d ON o.driver_id = d.id
            WHERE o.id = $1`
        const updatedResult = await pool.query(selectQuery, [bestelling_id])
        const updatedOrder = updatedResult.rows[0]

        // Log status change to console
        console.log(`[ORDER STATUS CHANGE] Order #${bestelling_id} | Driver: ${driver_id} | ${previousStatus} → ${nextStatus} | Customer: ${updatedOrder.customer_name}`)

        io.emit('order:status_changed', {
            order_id: bestelling_id,
            status: nextStatus,
            order: updatedOrder,
            timestamp: new Date()
        })

        socket.emit(successEvent, {
            succes: true,
            order_id: bestelling_id,
            message: successMessage
        })
    }

    // Events from driver clients.
    // driver logt in op app met naam --> status online
    
    // driver locatie updates 
    socket.on('driver:update_location', function(data) {
        const { driver_id, latitude, longitude, accuracy, timestamp } = data || {}
        if (!driver_id || latitude === undefined || longitude === undefined) {
            socket.emit('error', { message: 'driver_id, latitude en longitude zijn verplicht' })
            return
        }

        io.emit('driver:location_updated', {
            driver_id,
            latitude,
            longitude,
            accuracy: accuracy || null,
            timestamp: timestamp || Date.now()
        })
    })

    // driver start met delivery
    socket.on('driver:start_delivery', async function(data) {
        try {
            await updateDeliveryStatus(data, 'on_route', 'delivery_started', 'driver:delivery_started', 'Delivery gestart!')
        } catch(err) {
            console.error('Fout bij starten delivery:', err);
            socket.emit('error', { message: 'Database fout' })
        }
    })
    // driver stopt met delivery
    socket.on('driver:end_delivery', async function(data) {
        try {
            await updateDeliveryStatus(data, 'delivered', 'delivery_delivered', 'driver:delivery_ended', 'Delivery beëindigd!')
        } catch(err) {
            console.error('Fout bij eindigen van delivery:', err);
            socket.emit('error', { message: 'Database fout' })
        }
    })

    socket.on('driver:delivery_completed', async function(data) {
        try {
            await updateDeliveryStatus(data, 'delivered', 'delivery_delivered', 'driver:delivery_ended', 'Delivery beëindigd!')
        } catch (err) {
            console.error('Fout bij delivery_completed:', err)
            socket.emit('error', { message: 'Database fout' })
        }
    })
    // driver logt uit --> status offline

    // Events to driver (future extension points).
    // driver krijgt bestelling, max 2

    // driver krijgt route
}