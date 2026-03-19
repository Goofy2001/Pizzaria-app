// ophalen van packages
const express = require('express')
const router = express.Router()

// ophalen van de database voor databewerking
const pool = require('../configs/database')

//basis crud
//CREATE
//post
router.post('/', async function(req, res) {
    try {
        const {customer_name, customer_email, customer_telephoneNumber, branch_id, type, delivery_postalCode, delivery_municipality, delivery_streetName, delivery_houseNumber, requested_hour} = req.body // variabelen die vanuit de klant meegegeven moeten worden (dus niet status, driver_id, delivery_started, delivery_delivered)
        // validatie voor correcte nieuwe bestellingen
        if (!customer_name || !customer_email || !customer_telephoneNumber) {return res.status(400).json({error: 'naam, email en telefoonnummer van de klant zijn verplicht'})}
        if (!branch_id || !requested_hour) {return res.status(400).json({error: 'vestiging en uur zijn nodig'})}
        if (type !== 'pick-up' && type !== 'delivery') {return res.status(400).json({error: 'geen geaccepteerd type --> pick-up of delivery'})}
        const branchResult = await pool.query(`SELECT id, name, has_delivery FROM branch WHERE id = $1`, [branch_id])
        if (branchResult.rows.length === 0) {return res.status(404).json({error: 'vestiging is niet gevonden'})}
        const branch = branchResult.rows[0]
        if (type === 'delivery' && !branch.has_delivery) {return res.status(400).json({error: `branch ${branch_id} heeft enkel pick-up`})}
        if (type === 'delivery') {
            if (!delivery_postalCode || !delivery_municipality || !delivery_streetName || !delivery_houseNumber) {return res.status(400).json({error: 'Leveringsadres is nodig'})}}
        // query voor het toevoegen van een nieuwe rij
        const query = `
            INSERT INTO orders (
                    customer_name, customer_email, customer_telephoneNumber,
                    branch_id, type,
                    delivery_postalCode, delivery_municipality, 
                    delivery_streetName, delivery_houseNumber, 
                    requested_hour, status)
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, 'pending')
                RETURNING *`
        const result = await pool.query(query, 
            [customer_name, customer_email, customer_telephoneNumber, 
            branch_id, type, 
            type === 'delivery' ? delivery_postalCode : null , type === 'delivery' ? delivery_municipality : null,
            type === 'delivery' ? delivery_streetName : null, type === 'delivery' ? delivery_houseNumber : null,
            requested_hour])
        const newOrder = result.rows[0]
        res.status(201).json(newOrder)
    } catch(err) {
        console.error('Error creating order:', err)
        res.status(500).json({error: 'Database error'})
    }
})

//READ
// lees alle orders
router.get('/', async function(req, res) {
    try {
        const query = `
            SELECT o.*, b.name as branch_name, d.name as driver_name
            FROM orders o LEFT JOIN branch b ON o.branch_id = b.id LEFT JOIN drivers d ON o.driver_id = d.id
            ORDER BY o.created DESC`
        const result = await pool.query(query)
        res.status(200).json(result.rows)
    } catch(err) {
        console.error('Error asking database:', err)
        res.status(500).json({error: 'Database error'})
    }
})
// lees een order
router.get('/:id', async function(req, res) {
    try  {
        const id = req.params.id
        const query = `
            SELECT o.*, b.name as branch_name, d.name as driver_name
                FROM orders o
                LEFT JOIN branch b ON o.branch_id = b.id LEFT JOIN drivers d ON o.driver_id = d.id
                WHERE o.id = $1
                ORDER BY o.created DESC`
        const result = await pool.query(query, [id])
        if (result.rows.length === 0) {return res.status(404).json({error: `Bestelling ${id} bestaat niet`})}
        res.status(200).json(result.rows[0])
    } catch(err) {
        console.error('Error asking database:', err)
        res.status(500).json({error: 'Database error'})
    }
})

//UPDATE
router.patch('/:id', async function(req, res) {
    try {
        const id = req.params.id
        const {customer_name,customer_email,customer_telephoneNumber,
            branch_id,type,
            delivery_postalCode,delivery_municipality,
            delivery_streetName,delivery_houseNumber,
            requested_hour} = req.body
        // valideren
        const orderResult = await pool.query(`SELECT * FROM orders WHERE id = $1`,[id]) // haalt de order op die geupdate gaat worden
        if (orderResult.rows.length === 0) {return res.status(404).json({ error: `bestelling ${id} bestaat niet`})}
        const olderOrder = orderResult.rows[0] // zet de order in een variabele
        const effectiveBranchId = branch_id !== undefined ? branch_id : olderOrder.branch_id // wat is de branch_id van de geupdate/ of oude
        const branchResult = await pool.query(`SELECT has_delivery FROM branch WHERE id = $1`, [effectiveBranchId]) // wat is de oude/geupdate branch
        if (branchResult.rows.length === 0) {return res.status(400).json({ error: 'Branch bestaat niet' })} 
        const hasDelivery = branchResult.rows[0].has_delivery // heeft de branch delivery?
        const newType = type !== undefined ? type : olderOrder.type // wat is de type van de geupdate/oude branch
        if (newType === 'delivery' && !hasDelivery) {return res.status(400).json({ error: 'Deze vestiging levert niet' })}
        if (newType === 'delivery') {
            if (!delivery_postalCode || !delivery_municipality || !delivery_streetName || !delivery_houseNumber) {
                return res.status(400).json({ error: 'Adres moet meegegeven worden voor delivery' })}}
        // opbouwen arrays voor query --> welke variabelen gaan we aanpassen
        const fields = [];
        const values = [];
        let index = 1;
        function addField(name, value) {
            fields.push(`${name} = $${index}`)
            values.push(value)
            index++}
        if (customer_name !== undefined) {addField('customer_name', customer_name)}
        if (customer_email !== undefined) {addField('customer_email', customer_email)}
        if (customer_telephoneNumber !== undefined) {addField('customer_telephoneNumber', customer_telephoneNumber)}
        if (branch_id !== undefined) {addField('branch_id', branch_id)}
        if (type !== undefined) {addField('type', newType)}
        if (requested_hour !== undefined) {addField('requested_hour', requested_hour)}
        if (newType === 'delivery') {
            addField('delivery_postalCode', delivery_postalCode)
            addField('delivery_municipality', delivery_municipality)
            addField('delivery_streetName', delivery_streetName)
            addField('delivery_houseNumber', delivery_houseNumber)
        } else {
            addField('delivery_postalCode', null)
            addField('delivery_municipality', null)
            addField('delivery_streetName', null)
            addField('delivery_houseNumber', null)
        }
        if (fields.length === 0) {return res.status(400).json({ error: 'Geen velden om te updaten' })}
        values.push(id);
        // opstellen van de query
        const query = `
            UPDATE orders
                SET ${fields.join(', ')}
                WHERE id = $${values.length}
                RETURNING *` // geef de aangepaste rijen terug (is altijd maar 1)
        const result = await pool.query(query, values) //query uitvoeren op db
        res.status(200).json(result.rows[0]) // succes, geef de aangepaste rij weer
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

//DELETE
//delete :id
router.delete('/:id', async function(req, res) {
    try {
        const id = req.params.id
        // valideren
        const orderResult = await pool.query(`SELECT * FROM orders WHERE id = $1`, [id])
        if (orderResult.rows.length === 0) {return res.status(404).json({error: `bestelling ${id} bestaat niet`})}
        if (orderResult.rows[0].status !== "pending") {return res.status(400).json({error: `bestelling ${id} is al in productie`})}
        // query om de rij te deleten
        const query = `
            DELETE FROM orders
                WHERE id = $1
                RETURNING *`
        const result = await pool.query(query, [id])
        if (result.rows.length === 0) {return res.status(404).json({error: `Bestelling ${id} bestaat niet`})}
        res.status(200).json(result.rows[0])
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
})

//extra
//get ?branch_id=1
router.get('/branch/:branch_id', async function(req, res) {
    try {
        const branch_id = req.params.branch_id
        const query = `
            SELECT o.*, b.name as branch_name, d.name as driver_name
            FROM orders o LEFT JOIN branch b ON o.branch_id = b.id LEFT JOIN drivers d ON o.driver_id = d.id
            WHERE o.branch_id = $1
            ORDER BY o.created DESC`
        const result = await pool.query(query, [branch_id])
        res.status(200).json(result.rows)
    } catch(err) {
        console.error('Error asking database:', err)
        res.status(500).json({error: 'Database error'})
    }
})

//get ?driver_id=1
router.get('/drivers/:driver_id', async (req,res) => {
    try {
        const driver_id = req.params.driver_id
        const query = `
            SELECT o.*, d.name as driver_name
                FROM orders o LEFT JOIN drivers d ON o.driver_id = d.id
                WHERE o.driver_id = $1`
        const result = await pool.query(query, [driver_id])
        res.status(200).json(result.rows)
    } catch (error) {
        console.error('Error asking database:', err)
        res.status(500).json({error: 'Database error'})
    }
})
//get ?status=pending
//get ?type=delivery
//get ?date=2026-02-20
//get /active/:branch_id
//get /pending/:branch_id
//patch /:id/status
router.patch('/:id/status', async function(req, res) {
    try {
        const id = req.params.id
        const status = req.body.status
        // valideren
        if (!status) {return res.status(400).json({error: "status input is nodig voor patch"})}
        const validStatus = ['pending', 'paid','preparing','ready','loaded_for_delivery','picked_up','on_table','on_route','delivered','cancelled']
        if (!validStatus.includes(status)) {return res.status(400).json({ error: "Ongeldige status waarde" })}
        //query opstellen
        const query = `
            UPDATE orders
                SET status = $1
                WHERE id = $2
                RETURNING *`
        const result = await pool.query(query, [status, id])
        if (result.rows.length === 0) {return res.status(404).json({error: `Bestelling ${id} niet gevonden`})}
        res.status(200).json(result.rows[0])
    } catch(err) {
        console.error("Error updating status", err)
        res.status(500).json({error: ' Database error'})
    }
})
//patch /:id/assign-driver
router.patch('/:id/assign-driver', async function(req, res) {
    try {
        const id = req.params.id
        const driver_id = req.body.driver_id
        // valideren
        if (!driver_id) {return res.status(400).json({error: "driver_id nodig"})}
        const driverResult = await pool.query(`SELECT * FROM drivers WHERE id = $1`,[driver_id]) // haalt de driver op die op de bestelling wordt gezet
        if (driverResult.rows.length === 0 ) {return res.status(400).json({error: "Driver_id correspondeerd met niemand"})}
        const driverOnlineResult = await pool.query(`SELECT * FROM drivers WHERE (id = $1 AND status = 'ONLINE')`, [driver_id])
        if (driverOnlineResult.rows.length === 0 ) {return res.status(400).json({error: "Driver is niet online"})}
        const orderResult = await pool.query(`SELECT * FROM orders WHERE id = $1`, [id]) // haalt de order op dat geupdate wordt
        if (orderResult.rows.length === 0) {return res.status(404).json({error: `bestelling ${id} bestaat niet`})}
        const order = orderResult.rows[0] // steekt de order in variabele
        if (order.type !== "delivery") {return res.status(400).json({error: `Bestelling ${id} is geen levering`})}
        if (order.driver_id !== null) {return res.status(400).json({error: `Bestelling ${id} is al toegewezen aan een driver`})}
        if (order.status !== "ready") {return res.status(400).json({error: `Bestelling ${id} is nog niet klaar om door te geven aan driver`})}
        
        // query opstellen
        const query = `
            UPDATE orders
                SET driver_id = $1, status = 'loaded_for_delivery'
                WHERE id = $2
                RETURNING *`
        const result = await pool.query(query, [driver_id, id])
        console.log(`Driver ${driver.name} is verbonden aan bestelling ${id}`)
        res.status(200).json({...result.rows[0], driver_name: driver.name})
    } catch(err) {
        console.error("Error updating status", err)
        res.status(500).json({error: ' Database error'})
    }
})
//patch /:id/unassign-driver

// maak global
module.exports = router