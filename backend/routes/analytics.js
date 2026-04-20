// ophalen van packages
const express = require('express')
const router = express.Router()

// ophalen van de database voor databewerking
const pool = require('../configs/database')

//read
//GET    /api/analytics/stats/driver/:driver_id  // Driver performance
// → Retourneert: aantal leveringen, gem. tijd, etc.
// Basic analytics endpoint for one driver's delivery records.
router.get('/drivers/:driver_id', async function(req, res) {
    try {
        const driver_id = req.params.driver_id
        //validatie
        const driverResult = await pool.query(`SELECT * FROM drivers WHERE id = $1`, [driver_id])
        if (driverResult.rows.length === 0) {return res.status(404).json({error: `Er is geen corresponderende driver`})}
        // query opbouwen
        const query = `
            SELECT o.*, d.name AS driver_name
                FROM orders o
                JOIN drivers d ON o.driver_id = d.id
                WHERE o.driver_id = $1`
        const result = await pool.query(query, [driver_id])
        if (result.rows.length === 0) {return res.status(400).json({error: `driver heeft nog geen leveringen gedaan`})}
        res.status(200).json(`${result.rows[0].driver_name} heeft bestellingen ${result.rowCount} levering`)
    } catch(err) {
        console.error('Error asking database:', err)
        res.status(500).json({error: 'Database error'})
    }
    
})

// Heat maps
//GET    /api/analytics/heatmap/:branch_id       // Data voor heat map

// Statistieken
//GET    /api/analytics/stats/:branch_id         // Algemene stats
// → Retourneert: totaal bestellingen, gem. afstand, gem. duur, etc.


// Coverage area
//GET    /api/analytics/coverage/:branch_id      // Verzorgingsgebied

// Postcode analyse
//GET    /api/analytics/postcodes/:branch_id     // Bestellingen per postcode

// Tijdlijnen
//GET    /api/analytics/timeline?start=2026-01-01&end=2026-02-01
// → Bestellingen over tijd

// Top data
//GET    /api/analytics/top-streets/:branch_id   // Meest voorkomende straten
//GET    /api/analytics/top-customers             // Meest trouwe klanten

// global maken
module.exports = router