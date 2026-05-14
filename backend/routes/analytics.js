/**
 * ANALYTICS ROUTES
 * Doel: Analytics en statistieken endpoints voor drivers en orders
 */

const express = require('express') //inladen express
const router = express.Router() //open een endpoint
const pool = require('../configs/database') //connectie met db

/**
 * GET /api/analytics/drivers/:driver_id: method voor het ophalen van aantal leveringen door 1 bepaalde driver
 * required parameters: driver_id
 */
router.get('/drivers/:driver_id', async function(req, res) {
    try {
        const driver_id = req.params.driver_id
        // Valideer dat driver bestaat
        const driverResult = await pool.query(`SELECT * FROM drivers WHERE id = $1`, [driver_id])
        if (driverResult.rows.length === 0) {
            return res.status(404).json({error: `Driver niet gevonden`})
        }
        // Query driver orders voor statistieken
        const query = `
            SELECT o.*, d.name AS driver_name
                FROM orders o
                JOIN drivers d ON o.driver_id = d.id
                WHERE o.driver_id = $1`
        const result = await pool.query(query, [driver_id])
        // Controleer of driver leveringen heeft
        if (result.rows.length === 0) {
            return res.status(400).json({error: `Driver heeft nog geen leveringen gedaan`})
        }
        // Return statistieken
        res.status(200).json(`${result.rows[0].driver_name} heeft ${result.rowCount} leveringen gedaan`)
    } 
    catch(err) {
        console.error('Error asking database:', err)
        res.status(500).json({error: 'Database error'})
    }
})

module.exports = router //maak router global