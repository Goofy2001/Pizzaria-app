const express = require('express') //inladen van express
const router = express.Router() //router maken voor endpoints
const pool = require('../configs/database') //database connectie

//basis crud

//CREATE
//post --> nieuwe driver toevoegen
// Create a new driver for a delivery-enabled branch.
router.post('/', async function(req, res) {
    try {
        //opslaan van de request parameters in variabelen
        const {name, branch_id} = req.body
        //error handling: parameters zijn niet meegestuurd
        if (!name || !branch_id) {return res.status(400).json({error: 'Geef een naam en branch_id'})}
        //sla resultaar van query op
        const branchResult = await pool.query(`SELECT * FROM branch WHERE id = $1`, [branch_id])
        //error handling: er is geen vestiging gevonden
        if (branchResult.rows.length === 0) {return res.status(404).json({error: `branch ${branch_id} bestaat niet`})}
        //error handling: de vestiging heeft geen leveringen
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
// Read all drivers (with branch name).
router.get('/', async function(req, res) { 
    try {
        // query opstellen voor alle drivers op te vragen
        const query = `
            SELECT d.*, b.name as branch_name
                FROM drivers d
                LEFT JOIN branch b ON d.branch_id = b.id`
        const result = await pool.query(query)
        //error handling: check of er drivers zijn
        if (result.rows.length === 0) {return res.status(404).json({error: 'no drivers found'})}
        //stuur response terug
        res.status(200).json(result.rows)
    } catch(err) {
        console.error('Error asking database:', err)
        res.status(500).json({error: 'Database error'})
    }
})

// get /selection/branch/:branch_id --> online drivers met busy status (voor onbeschikbare status in front dashboard)
// Read assignable drivers for one branch, including busy flag.
router.get('/selection/branch/:branch_id', async function(req, res) {
    try {
        //sla request parameter op in variabele
        const branch_id = req.params.branch_id
        //query voor vestiging te zoeken
        const branchResult = await pool.query('SELECT id FROM branch WHERE id = $1', [branch_id])
        //error handling: er is geen vestiging
        if (branchResult.rows.length === 0) {
            return res.status(404).json({ error: 'Geen branch gevonden in database' })
        }
        //query voor het alle drivers te selecteren (dat busy status hebben) voor een bepaalde branch
        const query = `
            SELECT
                d.id,
                d.name,
                d.status,
                d.latitude,
                d.longitude,
                d.last_location_update,
                d.branch_id,
                EXISTS (
                    SELECT 1
                    FROM orders o
                    WHERE o.driver_id = d.id
                      AND o.status IN ('loaded_for_delivery', 'on_route')
                ) AS is_busy
            FROM drivers d
            WHERE d.branch_id = $1
              AND d.status = 'ONLINE'
            ORDER BY d.name ASC`
        //doe query
        const result = await pool.query(query, [branch_id])
        //stuur resultaat terug
        res.status(200).json(result.rows)
    } catch (err) {
        console.error('Error asking database:', err)
        res.status(500).json({ error: 'Database error' })
    }
})

// get /locations/branch/:branch_id: get method voor verkrijgen van laatste locatie van alle drivers voor een branch
router.get('/locations/branch/:branch_id', async function(req, res) {
    try {
        //sla request parameters om naar variabelen
        const branch_id = Number(req.params.branch_id)
        //error handling: is het branch id geldig
        if (!Number.isInteger(branch_id) || branch_id <= 0) {
            return res.status(400).json({ error: 'Geef een geldig branch_id' })
        }
        //select query: voor bepaalde branch selecteer 1 rij per driver (laatste gps coordinaat op basis van tijd)
        const result = await pool.query(
            `SELECT DISTINCT ON (g.driver_id)
                g.driver_id,
                g.latitude,
                g.longitude,
                g.timestamp
             FROM gps_tracking g
             JOIN drivers d ON d.id = g.driver_id
             WHERE d.branch_id = $1
             ORDER BY g.driver_id, g.timestamp DESC`,
            [branch_id]
        )
        //stuur response
        return res.status(200).json(result.rows)
    } catch (err) {
        console.error('Error asking database:', err)
        return res.status(500).json({ error: 'Database error' })
    }
})

// get /:id/locations --> krijg gps coordinaten van een bepaalde driver (bewegingslijn voor drivers)
router.get('/:id/locations', async function(req, res) {
    try {
        //sla request variabelen op en variabelen
        const id = Number(req.params.id)
        const limit = Number(req.query.limit || 5)
        //error handling: geldig driver.id
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ error: 'Geef een geldig driver id' })
        }
        //error handling: het limiet beperken
        const safeLimit = Number.isInteger(limit) && limit > 0 ? Math.min(limit, 5) : 5
        //select query met variabelen
        const result = await pool.query(
            `SELECT driver_id, latitude, longitude, timestamp
             FROM gps_tracking
             WHERE driver_id = $1
             ORDER BY timestamp DESC
             LIMIT $2`,
            [id, safeLimit]
        )
        //stuur response terug naar server
        return res.status(200).json(result.rows)
    } catch (err) {
        console.error('Error asking database:', err)
        return res.status(500).json({ error: 'Database error' })
    }
})

//get --> 1 driver
// Read one driver by id.
router.get('/:id', async function(req, res) {
    try {
        //steek req in variabelen
        const {id} = req.params
        //select sql voor bepaalde driver
        const query = `
            SELECT id, name, status, branch_id
                FROM drivers
                WHERE id = $1`
        const result = await pool.query(query, [id])
        //error handling: geen geldig driver.id
        if (result.rows.length === 0) {return res.status(404).json({error: `Geen drivers gevonden voor dit id: ${id}`})}
        //stuur response terug
        res.status(200).json(result.rows[0])
    } catch(err) {
        console.error('Error fetching driver:', err)
        res.status(500).json({error: 'Database error'})
    }
})

//get /branch/:branch_id
// Read all drivers for a specific branch.
router.get('/branch/:branch_id', async function(req, res) {
    try {
        //sla req.parameters op in variabelen
        const branch_id = req.params.branch_id
        //select query voor het zoekn naar specifieke branch
        const branchResult = await pool.query(`SELECT * FROM branch WHERE id = $1`, [branch_id])
        //error handling: vestiging bestaat niet
        if (branchResult.rows.length === 0 ) {return res.status(404).json({error: "Geen branch gevonden in database"})}
        // query opstellen
        const query = `
            SELECT d.*, b.name as branch_name
                FROM drivers d
                LEFT JOIN branch b ON d.branch_id = b.id
                WHERE d.branch_id = $1`
        const result = await pool.query(query, [branch_id])
        //error handling: er zijn geen drivers voor de branch
        if (result.rows.length === 0 ) {return res.status(404).json({error: `Geen drivers gevonden voor branch ${branch_id}`})}
        res.status(200).json(result.rows)
    } catch(err) {
        console.error('Error asking database:', err)
        res.status(500).json({error: 'Database error'})
    }
})

//get /on_route/:driver_id --> krijg on_route bestellingen voor een specifieke driver (origineel wou ik zorgen dat de applicatie 2 orders per driver ondersteunde maar dit was te ingewikkeld voor een beginner)
router.get('/on_route/:driver_id', async function(req, res) {
    try {
        //sla req params op in variabele
        const driver_id = req.params.driver_id
        //error handling: bestaat de driver
        const driverResult = await pool.query(`SELECT * FROM drivers WHERE id = $1`, [driver_id]) // haalt de corresponderende driver op
        if (driverResult.rows.length === 0 ) {return res.status(404).json({error: `driver met id ${driver_id} bestaat niet`})}
        // query opstellen
        const query = `
            SELECT o.*, d.name as driver_name
                FROM orders o
                LEFT JOIN drivers d ON o.driver_id = d.id
                WHERE o.driver_id = $1`
        const result = await pool.query(query, [driver_id])
        //error handling/optie: driver heeft geen bestellingen
        if (result.rows.length === 0) {return res.status(404).json({error: `driver ${driver_id} heeft geen actieve bestellingen`})}
        res.status(200).json(result.rows)
    } catch(err) {
        console.error('Error asking database:', err)
        res.status(500).json({error: 'Database error'})
    }
})

//UPDATE
//OLD: patch :status-toggle --> status van driver aanpassen
// Toggle driver status between ONLINE and OFFLINE.
router.patch('/status-toggle', async function(req, res) {
    try {
        //req params opslaan in variabele
        const id = req.body.id
        //error handling: geen id meegegeven
        if (!id) {res.status(400).json({error: "Geef een id op"})}
        //select query voor driver te zoekn
        const driverResult = await pool.query(`SELECT * FROM drivers WHERE id = $1`, [id])
        //error handling: geen driver in database
        if (driverResult.rows.length === 0) {return res.status(404).json({error: "Geef een geldig id"})}
        //sla oude status op
        const oldStatus = driverResult.rows[0].status
        //zet nieuwe status naar het omgekeerde
        let newStatus
        if (oldStatus === "ONLINE") {newStatus = "OFFLINE"}
        else if (oldStatus === "OFFLINE") {newStatus = "ONLINE"}
        //error handling: oude status is niet valid
        else {return res.status(400).json({error: `De status (${oldStatus}) behoort niet tot de geldige statussen: OFFLINE of ONLINE`})}
        //update query om nieuwe status te uploaden
        const query = `
            UPDATE drivers
                SET status = $1
                WHERE id = $2
                RETURNING *`
        const result = await pool.query(query, [newStatus, id])
        //console log voor debugging
        console.log(`[DRIVER STATUS] Driver #${id} status toggled: ${oldStatus} -> ${newStatus}`)
        //stuur antwoord terug
        return res.status(200).json(result.rows[0])
    } catch(err) {
        console.error('Error asking database:', err)
        res.status(500).json({error: 'Database error'})
    }
}) 


//crud operaties voor de toekomst

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