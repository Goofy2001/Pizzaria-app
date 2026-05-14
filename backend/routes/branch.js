/**
 * BRANCH/VESTIGING ROUTES
 * Endpoints:
 * - POST /api/branch          : Maak nieuwe vestiging
 * - GET /api/branch           : Haal alle vestigingen op
 * - GET /api/branch/:id       : Haal één vestiging op
 * - PATCH /api/branch/:id     : Update vestiging gegevens
 * - DELETE /api/branch/:id    : Verwijder vestiging
 * ====================================================================
 */

// Import Express framework voor router functionaliteit
const express = require('express') //importeer express
const router = express.Router() //maak een endpoint

const pool = require('../configs/database') //database connectie aanmaken

/**
 * CREATE ENDPOINT
 * POST /api/branch: post method voor het aanmaken van een vestiging
 */
router.post('/', async function(req, res) {
    try {
        //post parameters omzetten naar variabelen
        const {name, address, has_delivery} = req.body
        //error handling: check dat variabelen aanwezig zijn
        if (!name || !address) {
            return res.status(400).json({error: 'Name and address zijn verplicht'})
        }
        // SQL INSERT query: voeg nieuwe vestiging toe aan database
        const query = `
            INSERT INTO branch (name, address, has_delivery)
            VALUES ($1, $2, $3)
            RETURNING *`
        //voer sql uit met variabelen (has_delivery is standaard false)
        const result = await pool.query(query, [name, address, has_delivery || false])
        //sla result op
        const newBranch = result.rows[0]
        //stuur result terug
        res.status(201).json(newBranch)
    } 
    catch(err) {
        // Log error naar console
        console.error('Error creating branch:', err)
        res.status(500).json({error: 'Database error' })
    } 
})

/**
 * READ ALL ENDPOINT
 * GET /api/branch: get method voor alle branches op te halen
 */
router.get('/', async function(req, res) {
    try {
        // SQL SELECT query: haal alle rijen uit branch tabel
        const query = `SELECT * FROM branch`
        // Execute query
        const result = await pool.query(query)
        //stuur resultaat terug
        res.status(200).json(result.rows)
    } 
    catch(err) {
        // Log error naar console
        console.error('Error asking database:', err)
        res.status(500).json({error: 'Database error'})
    }
})

/**
 * READ ONE ENDPOINT
 * GET /api/branch/:id: get method voor 1 branch op te halen
 */
router.get('/:id', async function(req, res) {
    try {
        // Haal ID uit URL parameters
        const id = req.params.id
        // SQL SELECT query: haal vestiging met gegeven ID
        const query = `SELECT * FROM branch WHERE id = $1`
        // Execute query met id parameter
        const result = await pool.query(query, [id])
        // Check of vestiging gevonden is
        if (result.rows.length === 0) { 
            return res.status(404).json({ error: `branch ${id} bestaat niet`})
        }
        //stuur resultaat terug
        res.status(200).json(result.rows[0])
    } 
    catch(err) {
        // Log error naar console
        console.error('Error asking database:', err)
        res.status(500).json({error: 'Database error'})
    }
})

/**
 * UPDATE ENDPOINT
 * PATCH /api/branch/:id: patch method om branch aan te passen via backend --> werdt niet gebruikt in applicatie (voor leren CRUD)
 */
router.patch('/:id', async function(req, res) {
    try {
        // Haal ID uit URL parameters
        const id = req.params.id
        // Destructure mogelijke update velden uit request body
        const {name, address, has_delivery} = req.body
        // Arrays voor dynamische query opbouw
        const fields = [] // Kolom assignment expressions
        const values = [] // Waarden voor parameterized query
        let index = 1 // Parameter index counter ($1, $2, etc.)
        // Helper functie om veld toe te voegen als NOT undefined
        // Dit bouwt dynamische SET clausule op
        if (name !== undefined) {
            fields.push(`name = $${index}`) // Voeg "name = $1" toe aan array
            values.push(name) // Voeg name waarde toe
            index++ // Increment parameter counter
        }
        // Herhaal voor address veld
        if (address !== undefined) {
            fields.push(`address = $${index}`)
            values.push(address)
            index++
        }
        // Herhaal voor has_delivery veld
        if (has_delivery !== undefined) {
            fields.push(`has_delivery = $${index}`)
            values.push(has_delivery)
            index++
        }
        // Controleer of minstens één veld verstrekt is
        if (fields.length === 0) {
            return res.status(400).json({error: "Geen input meegegeven"})
        }
        // Voeg ID toe als laatste parameter waarde
        values.push(id)
        // Bouw SQL UPDATE query
        // fields.join(',') combineert array elementen: "name = $1, address = $2"
        const query = `
            UPDATE branch
                SET ${fields.join(',')}
                WHERE id = $${values.length}
                RETURNING *`
        // Execute query met parameters
        const result = await pool.query(query, values)
        // Controleer of vestiging gevonden en bijgewerkt
        if (result.rows.length === 0) {
            return res.status(404).json({error: `branch ${id} bestaat niet`})
        }
        // Return 200 OK + bijgewerkte vestiging
        res.status(200).json(result.rows[0])
    } 
    catch(err) {
        // Log error naar console
        console.error('Error asking database:', err)
        // Return 500 Server error
        res.status(500).json({error: 'Database error'})
    }
})

/**
 * DELETE ENDPOINT
 * DELETE /api/branch/:id: delete method voor het verwijderen van een branch
 */
router.delete('/:id', async function(req, res) {
    try {
        // Haal ID uit URL parameters
        const id = req.params.id
        // Valideer dat ID meegegeven is
        if (!id) {
            return res.status(400).json({ error: 'ID is required' })
        }
        // SQL DELETE query: verwijder vestiging met gegeven ID
        const query = `
            DELETE FROM branch
                WHERE id = $1
                RETURNING *`
        // Execute query met id parameter
        const result = await pool.query(query, [id])
        //error handling: Controleer of vestiging gevonden en verwijderd (rowCount = rijen beïnvloed)
        if (result.rowCount === 0) {
            return res.status(404).json({ error: `Branch ${id} bestaat niet` })
        }
        // Haal verwijderde vestiging data
        const deletedBranch = result.rows[0]
        //stuur response terug
        res.status(200).json(deletedBranch)
    } 
    catch (err) {
        // Log error naar console
        console.error('Error deleting branch:', err)
        res.status(500).json({ error: 'Database error' })
    }
})


module.exports = router // Export router zodat server.js het kan registreren