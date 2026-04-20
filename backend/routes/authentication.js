const express = require('express')
const router = express.Router()
const pool = require('../configs/database')

// Resolve expected password based on requested role.
function getExpectedPasswordForRole(role) {
	if (role === 'front') {
		return process.env.FRONT_LOGIN_PASSWORD || process.env.APP_LOGIN_PASSWORD || null
	}

	if (role === 'driver') {
		return process.env.DRIVER_LOGIN_PASSWORD || process.env.APP_LOGIN_PASSWORD || null
	}

	return null
}

// Login endpoint: validate credentials and return session payload.
router.post('/login', async function(req, res) {
	try {
		const { role, identifier, password } = req.body || {}

		if (!role || !identifier || !password) {
			return res.status(400).json({ error: 'role, identifier en password zijn verplicht' })
		}

		if (!['front', 'driver'].includes(role)) {
			return res.status(400).json({ error: 'role moet front of driver zijn' })
		}

		const expectedPassword = getExpectedPasswordForRole(role)
		if (!expectedPassword) {
			return res.status(500).json({ error: `Server misconfiguration: password voor role ${role} ontbreekt` })
		}

		if (password !== expectedPassword) {
			return res.status(401).json({ error: 'Ongeldige inloggegevens' })
		}

		const id = Number(identifier)
		if (!Number.isInteger(id) || id <= 0) {
			return res.status(400).json({ error: 'identifier moet een positief nummer zijn' })
		}

		if (role === 'front') {
			const branchResult = await pool.query('SELECT id, name FROM branch WHERE id = $1', [id])
			if (branchResult.rows.length === 0) {
				return res.status(404).json({ error: `Vestiging ${id} niet gevonden` })
			}

			const branch = branchResult.rows[0]
			return res.status(200).json({
				user: {
					role: 'front',
					branch_id: branch.id,
					branch_name: branch.name
				}
			})
		}

		const driverResult = await pool.query('SELECT id, name, branch_id, status FROM drivers WHERE id = $1', [id])
		if (driverResult.rows.length === 0) {
			return res.status(404).json({ error: `Driver ${id} niet gevonden` })
		}

		const updateLoginResult = await pool.query(
			`UPDATE drivers
				SET status = 'ONLINE'
				WHERE id = $1
				RETURNING id, name, branch_id, status`,
			[id]
		)

		const driver = updateLoginResult.rows[0]
		console.log(`[DRIVER STATUS] Driver #${driver.id} (${driver.name}) switched to ONLINE via login`)
		return res.status(200).json({
			user: {
				role: 'driver',
				driver_id: driver.id,
				driver_name: driver.name,
				branch_id: driver.branch_id,
				status: driver.status
			}
		})
	} catch (err) {
		console.error('Login error:', err)
		return res.status(500).json({ error: 'Database error' })
	}
})

// Logout endpoint.
router.post('/logout', async function(req, res) {
	try {
		const { role, identifier } = req.body || {}

		if (role === 'driver') {
			const id = Number(identifier)
			if (Number.isInteger(id) && id > 0) {
				const result = await pool.query(
					`UPDATE drivers
						SET status = 'OFFLINE'
						WHERE id = $1`,
					[id]
				)

				if (result.rowCount > 0) {
					console.log(`[DRIVER STATUS] Driver #${id} switched to OFFLINE via logout`)
				}
			}
		}

		return res.status(200).json({ ok: true })
	} catch (err) {
		console.error('Logout error:', err)
		return res.status(500).json({ error: 'Database error' })
	}
})

module.exports = router