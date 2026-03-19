// inladen van de packages
const express = require('express')
const router = express.Router()
const pool = require('../configs/database')

//basis crud

//CREATE
//post --> nieuwe driver toevoegen
router.post('/', async function(req, res) {
    try {
        const {name, branch_id} = req.body
        // validatie
        if (!name || !branch_id) {return res.status(400).json({error: 'Geef een naam en branch_id'})}
        const branchResult = await pool.query(`SELECT * FROM branch WHERE id = $1`, [branch_id])
        if (branchResult.rows.length === 0) {return res.status(404).json({error: `branch ${branch_id} bestaat niet`})}
        if (branchResult.rows[0].has_delivery !== true) {return res.status(400).json({error: 'Je probeert een driver toe te voegen bij een branch zonder levering'})}
        // query opstellen voor de nieuwe driver
        const query = `
            INSERT INTO drivers (name, branch_id)
                VALUES ($1, $2)
                RETURNING *`
        const result = await pool.query(query, [name, branch_id])
        res.status(201).json(result.rows[0]) // succes, toon nieuwe driver
    } catch(err) {
        console.error('Error creating driver:', err)
        res.status(500).json({error: 'Database error' })
    } 
})


//READ
// get  --> alle drivers
router.get('/', async function(req, res) { 
    try {
        // query opstellen voor alle drivers op te vragen
        const query = `
            SELECT d.*, b.name as branch_name
                FROM drivers d
                LEFT JOIN branch b ON d.branch_id = b.id`
        const result = await pool.query(query)
        if (result.rows.length === 0) {return res.status(404).json({error: 'no drivers found'})} // check of er drivers zijn
        res.status(200).json(result.rows)
    } catch(err) {
        console.error('Error asking database:', err)
        res.status(500).json({error: 'Database error'})
    }
})

//get --> 1 driver
router.get('/:id', async function(req, res) {
    try {
        const {id} = req.params
        // validatie
        const query = `
            SELECT id, name, status, branch_id
                FROM drivers
                WHERE id = $1`
        const result = await pool.query(query, [id])
        if (result.rows.length === 0) {return res.status(404).json({error: `Geen drivers gevonden voor dit id: ${id}`})}
        res.status(200).json(result.rows[0])
    } catch(err) {
        console.error('Error fetching driver:', err)
        res.status(500).json({error: 'Database error'})
    }
})

//get /branch/:branch_id --> krijg alle drivers voor bepaalde branch (momenteel nog geen nut maar is een failsafe als er een fout in db staat)
router.get('/branch/:branch_id', async function(req, res) {
    try {
        const branch_id = req.params.branch_id
        //validatie
        const branchResult = await pool.query(`SELECT * FROM branch WHERE id = $1`, [branch_id])
        if (branchResult.rows.length === 0 ) {return res.status(404).json({error: "Geen branch gevonden in database"})}
        // query opstellen
        const query = `
            SELECT d.*, b.name as branch_name
                FROM drivers d
                LEFT JOIN branch b ON d.branch_id = b.id
                WHERE d.branch_id = $1`
        const result = await pool.query(query, [branch_id])
        if (result.rows.length === 0 ) {return res.status(404).json({error: `Geen drivers gevonden voor branch ${branch_id}`})} // check of er drivers zijn
        res.status(200).json(result.rows)
    } catch(err) {
        console.error('Error asking database:', err)
        res.status(500).json({error: 'Database error'})
    }
})

//get /on_route/:driver_id --> krijg alle on_route bestellingen voor een specifieke driver
router.get('/on_route/:driver_id', async function(req, res) {
    try {
        const driver_id = req.params.driver_id
        //valideren
        const driverResult = await pool.query(`SELECT * FROM drivers WHERE id = $1`, [driver_id]) // haalt de corresponderende driver op
        if (driverResult.rows.length === 0 ) {return res.status(404).json({error: `driver met id ${driver_id} bestaat niet`})}
        // query opstellen
        const query = `
            SELECT o.*, d.name as driver_name
                FROM orders o
                LEFT JOIN drivers d ON o.driver_id = d.id
                WHERE o.driver_id = $1`
        const result = await pool.query(query, [driver_id])
        if (result.rows.length === 0) {return res.status(404).json({error: `driver ${driver_id} heeft geen actieve bestellingen`})}
        res.status(200).json(result.rows)
    } catch(err) {
        console.error('Error asking database:', err)
        res.status(500).json({error: 'Database error'})
    }
})

//UPDATE
//patch :status-toggle --> status van driver aanpassen
router.patch('/status-toggle', async function(req, res) {
    try {
        const id = req.body.id
        // valideren
        if (!id) {res.status(400).json({error: "Geef een id op"})}
        const driverResult = await pool.query(`SELECT * FROM drivers WHERE id = $1`, [id])
        if (driverResult.rows.length === 0) {return res.status(404).json({error: "Geef een geldig id"})}
        const oldStatus = driverResult.rows[0].status
        let newStatus
        if (oldStatus === "ONLINE") {newStatus = "OFFLINE"}
        else if (oldStatus === "OFFLINE") {newStatus = "ONLINE"}
        else {return res.status(400).json({error: `De status (${oldStatus}) behoort niet tot de geldige statussen: OFFLINE of ONLINE`})}
        const query = `
            UPDATE drivers
                SET status = $1
                WHERE id = $2
                RETURNING *`
        const result = await pool.query(query, [newStatus, id])
        return res.status(200).json(result.rows[0])
    } catch(err) {
        console.error('Error asking database:', err)
        res.status(500).json({error: 'Database error'})
    }
}) 


//DELETE
//delete :id

//extra
//post /:id/start-delivery
//post /:id/complete-delivery
//get /:id/orders
//get /:id/history
//get /available/:branch_id
//patch :id/status
//patch :id/location


// global maken
module.exports = router