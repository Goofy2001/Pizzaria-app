const express = require('express')
const router = express.Router()
const { reset_db } = require('../scripts/reset_db')

function requireApiKey(req, res, next) {
    const expected = process.env.INTERNAL_API_KEY
    const provided = req.get('x-api-key')

    if (!expected) {
        return res.status(500).json({ error: 'INTERNAL_API_KEY ontbreekt op de server' })
    }

    if (provided !== expected) {
        return res.status(401).json({ error: 'Ongeldige api key' })
    }

    next()
}

router.post('/reset-db', requireApiKey, async function(req, res) {
    try {
        await reset_db()
        return res.status(200).json({ ok: true, message: 'Database succesvol gereset en opnieuw gevuld' })
    } catch (err) {
        console.error('Reset DB error:', err)
        return res.status(500).json({ error: 'Database reset mislukt' })
    }
})

module.exports = router/*
  Admin route roadmap (documentation placeholder)

  Planned endpoints:
  - GET    /api/admin/dashboard
  - POST   /api/admin/orders/bulk-update
  - POST   /api/admin/drivers/bulk-assign
  - GET    /api/admin/settings
  - PATCH  /api/admin/settings

  Notes:
  - This file currently contains planning notes only.
  - Implement a real Express router here when admin features are started.
*/
