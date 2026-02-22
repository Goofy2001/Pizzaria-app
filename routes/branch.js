// ophalen van packages
const express = require('express')
const router = express.Router()

// ophalen van de database voor databewerking
const pool = require('../configs/database')

// basis CRUD voor de api
// create
router.post('/', async function(req, res) {
    try {
        const {name, address, has_delivery} = req.body  //Data input moet ingegeven worden via frontend (const name = req.body.name)
        if (!name || !address) {return res.status(400).json({error: 'Name and address'})} // foutmelding indien name and adress niet zijn opgegeven
        // query voor db: creer nieuwe rij, met variabele values, toon de nieuwe rij
        const query = `
            INSERT INTO branch (name, address, has_delivery)
            VALUES ($1, $2, $3)
            RETURNING *`
        const result = await pool.query(query, [name, address, has_delivery || false]) // default value is false
        const newBranch = result.rows[0] // maak nieuwe branch
        res.status(201).json(newBranch) // return positief signaal en toon de nieuwe branch
    } catch(err) {
        console.error('Error creating branch:', err)
        res.status(500).json({error: 'Database error' })
    } 
})

// Read
// opvragen alle rijen
router.get('/', async function(req, res) {
    try {
        // query voor het opvragen van alle rijen
        const query = `
            SELECT *
            FROM branch
            `
        // geef query door aan db
        const result = await pool.query(query)
        // weergeven alle rijen
        res.status(200).json(result.rows)
    } catch(err) {
        console.error('Error asking database:', err)
        res.status(500).json({error: 'Database error'})
    }
})
// opvragen één rij
router.get('/:id', async function(req, res) {
    try {
        const id = req.params.id // data nodig voor de query (const {id} = req.params)
        const query = `
            SELECT *
            FROM branch WHERE id = $1
            `
        const result = await pool.query(query, [id]) // doe de query gebruik makend van variabele id
        if (result.rows.length === 0) { 
            res.status(404).json({ error: `branch ${id} bestaat niet`})
        } else {
            res.status(200).json(result.rows[0]) // toon enkel de rij
        }
    } catch(err) {
        console.error('Error asking database:', err)
        res.status(500).json({error: 'Database error'})
    }
})

// Update (admin)
router.patch('/:id', async function(req, res) {
    try {
        const id = req.params.id // id steken in een variabele
        const {name, address, has_delivery} = req.body // andere velden in variabelen steken
        //opbouwen van de variabelen voor de query
        const fields = [] //array met kolomnamen 
        const values = [] //array met kolomwaarden
        let index = 1 // start van de loop
        if (name !== undefined) {
            fields.push(`name = $${index}`)
            values.push(name)
            index++}
        if (address !== undefined) {
            fields.push(`address = $${index}`)
            values.push(address)
            index++}
        if (has_delivery !== undefined) {
            fields.push(`has_delivery = $${index}`)
            values.push(has_delivery)
            index++}
        if (fields.length === 0) {
            return res.status(400).json({error: "Geen input meegegeven"})}
        values.push(id) //id toevoegen als laatste value
        // query voor db -->
        const query = `
            UPDATE branch
                SET ${fields.join(',')}
                WHERE id = $${values.length}
                RETURNING *`
        const result = await pool.query(query, values)
        if (result.rows.length === 0) {
            res.status(404).json({error: `branch ${id} bestaat niet`})
        } else {
            res.status(200).json(result.rows[0])
        }
    } catch(err) {
        console.error('Error asking database:', err)
        res.status(500).json({error: 'Database error'})
    }
})

//delete (admin)
router.delete('/:id', async function(req, res) {
    try {
        const id = req.params.id
        if (!id) {return res.status(400).json({ error: 'ID is required' })} //id moet meegegeven worden
        const query = `
            DELETE FROM branch
                WHERE id = $1
                RETURNING *`
        const result = await pool.query(query, [id]) //delete de rij
        if (result.rowCount === 0) {return res.status(404).json({ error: `Branch ${id} bestaat niet` })} //check of de id correspondeerd met een branch
        const deletedBranch = result.rows[0]
        res.status(200).json(deletedBranch)
    } catch (err) {
        console.error('Error deleting branch:', err)
        res.status(500).json({ error: 'Database error' })
    }
})


// EXTRA
//get :id/drivers
//get :id/orders

// exporteren van de functies voor de server
module.exports = router