//importeer de belangrijke packages
const express = require('express')
const router = express.Router()
const pool = require('../configs/database')

// zoek het juiste ww per rol
function getExpectedPasswordForRole(role) {
	if (role === 'front') { //als front --> zoek in .env naar het ww van front
		return process.env.FRONT_LOGIN_PASSWORD || process.env.APP_LOGIN_PASSWORD || null
	}

	if (role === 'driver') { //als driver --> zoek in .env naar het ww van driver
		return process.env.DRIVER_LOGIN_PASSWORD || process.env.APP_LOGIN_PASSWORD || null
	}

	return null
}

// login API: stuur signaal naar backend
router.post('/login', async function(req, res) {
	try {
		const { role, identifier, password } = req.body || {} //dit zijn de login variabelen

		if (!role || !identifier || !password) { //error handling: alle variabelen moeten meegegeven worden
			return res.status(400).json({ error: 'role, identifier en password zijn verplicht' })
		}

		if (!['front', 'driver'].includes(role)) { //error handling: als de rol niet correct is
			return res.status(400).json({ error: 'role moet front of driver zijn' })
		}

		const expectedPassword = getExpectedPasswordForRole(role) //zoek het juiste ww voor de bepaalde rol
		if (!expectedPassword) { //error handling: er is geen ww te vinden voor de rol in .env
			return res.status(500).json({ error: `Server misconfiguration: password voor rol: ${role} ontbreekt` })
		}

		if (password !== expectedPassword) { //error handling: het ww is fout
			return res.status(401).json({ error: 'Ongeldige inloggegevens' })
		}

		const id = Number(identifier)
		if (!Number.isInteger(id) || id <= 0) { //error handling: het id is altijd positief
			return res.status(400).json({ error: 'identifier moet een positief nummer zijn' })
		}

		if (role === 'front') {
			const branchResult = await pool.query('SELECT id, name FROM branch WHERE id = $1', [id]) //zoek naar de branch via de db
			if (branchResult.rows.length === 0) { //error handling: er is geen corresponderende branch in db
				return res.status(404).json({ error: `Vestiging ${id} niet gevonden` })
			}

			const branch = branchResult.rows[0] //branch gevonden --> sla op
			return res.status(200).json({ // stuur naar de frontend de gegevens van de branch en stop
				user: {
					role: 'front',
					branch_id: branch.id,
					branch_name: branch.name
				}
			})
		}

		const driverResult = await pool.query('SELECT id, name, branch_id, status FROM drivers WHERE id = $1', [id]) //zoeknaar de driver via de db
		if (driverResult.rows.length === 0) { //error handling: driver id bestaat niet in db
			return res.status(404).json({ error: `Driver ${id} niet gevonden` })
		}

		const updateLoginResult = await pool.query( //als driver gevonden is --> zet de driver online
			`UPDATE drivers
				SET status = 'ONLINE'
				WHERE id = $1
				RETURNING id, name, branch_id, status`,
			[id]
		)

		const driver = updateLoginResult.rows[0] // ingelogde driver details opslaan
		console.log(`[DRIVER STATUS] Driver #${driver.id} (${driver.name}) switched to ONLINE via login`) //melding voor het tonen dat driver is ingelogd
		return res.status(200).json({ // stuur naar backend de details van de driver
			user: {
				role: 'driver',
				driver_id: driver.id,
				driver_name: driver.name,
				branch_id: driver.branch_id,
				status: driver.status
			}
		})
	} catch (err) { // error handling: als er een andere error zou zijn
		console.error('Login error:', err)
		return res.status(500).json({ error: 'Database error' })
	}
})

// Logout API
router.post('/logout', async function(req, res) {
	try {
		const { role, identifier } = req.body || {} //sla de variabelen op

		if (role === 'driver') { //logout is enkel voor drivers
			const id = Number(identifier)
			if (Number.isInteger(id) && id > 0) {
				const result = await pool.query( //sql voor updaten db
					`UPDATE drivers
						SET status = 'OFFLINE'
						WHERE id = $1`,
					[id]
				)

				if (result.rowCount > 0) { //als de db geupdate is en er is een resultaat -->
					console.log(`[DRIVER STATUS] Driver #${id} switched to OFFLINE via logout`)
				}
			}
		}

		return res.status(200).json({ ok: true }) //eindig de api
	} catch (err) {
		console.error('Logout error:', err) //error handling: als er een error is
		return res.status(500).json({ error: 'Database error' })
	}
})

module.exports = router //maak de routes globaal