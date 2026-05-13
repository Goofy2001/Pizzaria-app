const express = require('express')
const router = express.Router()
const pool = require('../configs/database')

async function resolveBranchId(branchValue) {
    if (branchValue === undefined || branchValue === null || branchValue === '') {
        return null
    }

    const numeric = Number(branchValue)
    if (Number.isInteger(numeric) && numeric > 0) {
        const result = await pool.query('SELECT id FROM branch WHERE id = $1', [numeric])
        return result.rows[0]?.id || null
    }

    const normalized = String(branchValue).trim()
    const result = await pool.query(
        `SELECT id
         FROM branch
         WHERE LOWER(name) = LOWER($1)
            OR LOWER(name) LIKE LOWER($2)
            OR LOWER(address) LIKE LOWER($2)
         LIMIT 1`,
        [normalized, `%${normalized}%`]
    )

    return result.rows[0]?.id || null
}

router.post('/', async function(req, res) {
    try {
        const customer_name = req.body.customer_name || req.body.name
        const customer_email = req.body.customer_email || req.body.email
        const customer_telephonenumber = req.body.customer_telephonenumber || req.body.customer_telephoneNumber || req.body.phone
        const branchValue = req.body.branch_id || req.body.location
        const date = req.body.date
        const hour = req.body.hour || req.body.time
        const quantity = Number(req.body.quantity || req.body.guests)
        const opmerking = req.body.opmerking || req.body.notes || null

        if (!customer_name || !customer_email || !customer_telephonenumber) {
            return res.status(400).json({ error: 'naam, email en telefoonnummer zijn verplicht' })
        }

        const branch_id = await resolveBranchId(branchValue)
        if (!branch_id) {
            return res.status(400).json({ error: 'Ongeldige of onbekende vestiging' })
        }

        if (!date || !hour) {
            return res.status(400).json({ error: 'datum en uur zijn verplicht' })
        }

        if (!Number.isInteger(quantity) || quantity <= 0 || quantity > 20) {
            return res.status(400).json({ error: 'aantal personen moet tussen 1 en 20 liggen' })
        }

        const result = await pool.query(
            `INSERT INTO reservations
                (customer_name, customer_email, customer_telephonenumber, branch_id, date, hour, quantity, opmerking, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
             RETURNING *`,
            [customer_name, customer_email, customer_telephonenumber, branch_id, date, hour, quantity, opmerking]
        )

        return res.status(201).json(result.rows[0])
    } catch (err) {
        console.error('Error creating reservation:', err)
        return res.status(500).json({ error: 'Database error' })
    }
})

module.exports = router