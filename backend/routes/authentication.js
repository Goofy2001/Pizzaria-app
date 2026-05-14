/**
 * 
 * AUTHENTICATION ROUTES
 * Doel: Login en logout endpoints voor drivers en restaurant managers
 * 
 * Endpoints:
 * - POST /api/auth/login: Valideer inloggegevens en retourneer session
 * - POST /api/auth/logout: Update driver status naar OFFLINE
*/

const express = require('express') //import express
const router = express.Router() //maak endpoint op router
const pool = require('../configs/database') //connectie met db

/**
 * HELPER FUNCTIE: Bepaal verwacht wachtwoord per rol
 */
function getExpectedPasswordForRole(role) {
	// Als rol 'front' (restaurant manager): verkrijg FRONT_LOGIN_PASSWORD
	if (role === 'front') {
		return process.env.FRONT_LOGIN_PASSWORD || process.env.APP_LOGIN_PASSWORD || null
	}
	// Als rol 'driver' (chauffeur): verkrijg DRIVER_LOGIN_PASSWORD
	if (role === 'driver') {
		return process.env.DRIVER_LOGIN_PASSWORD || process.env.APP_LOGIN_PASSWORD || null
	}
	// Onbekende rol: return null --> backend beveiliging
	return null
}

/**
 * LOGIN ENDPOINT
 * POST /api/auth/login: method om login gegevens te verzenden en een reactie te krijgen van db
 */
router.post('/login', async function(req, res) {
	try {
		//haal de parameters uit de post.request en zet ze in een variabele --> als er 1 niet meegestuurd is, maak een leeg object
		const { role, identifier, password } = req.body || {} 
		//error handling: Check of alle vereiste velden aanwezig zijn
		if (!role || !identifier || !password) {
			return res.status(400).json({ error: 'role, identifier en password zijn verplicht' })
		}
		//error handling: Check of de rol correct is: front of driver
		if (!['front', 'driver'].includes(role)) {
			return res.status(400).json({ error: 'role moet front of driver zijn' })
		}
		//haal het correcte wachtwoord op
		const expectedPassword = getExpectedPasswordForRole(role)
		//error handling: is er een wachtwoord geconfigureerd in de backend?
		if (!expectedPassword) {
			return res.status(500).json({ error: `Server misconfiguration: password voor role ${role} ontbreekt` })
		}
		//error handling: is het post.request wachtwoord hetzelfde als het backend wachtwoord
		if (password !== expectedPassword) {
			return res.status(401).json({ error: 'Ongeldige inloggegevens' })
		}
		//zet id variabele om naar een nummer
		const id = Number(identifier)
		//error handling: is het id geldig
		if (!Number.isInteger(id) || id <= 0) {
			return res.status(400).json({ error: 'identifier moet een positief nummer zijn' })
		}
		/**
		 * AUTHENTICATIE VOOR 'FRONT' ROL (Restaurant Manager)
		 */
		if (role === 'front') { 
			// Voer database query uit: SELECT branch met gegeven ID
			const branchResult = await pool.query(
				'SELECT id, name FROM branch WHERE id = $1', 
				[id]
			)
			//error handling: branch is niet gevonden
			if (branchResult.rows.length === 0) {
				return res.status(404).json({ error: `Vestiging ${id} niet gevonden` })
			}
			// Verkrijg branch data uit query resultaat
			const branch = branchResult.rows[0]
			// Retourneer succesvolle login met branch info
			return res.status(200).json({
				user: {
					role: 'front', // User role
					branch_id: branch.id, // Vestigings ID
					branch_name: branch.name // Vestigings naam
				}
			})
		}
		/**
		 * AUTHENTICATIE VOOR 'DRIVER' ROL (Chauffeur): momenteel zijn er enkel 2 rollen
		 */
		
		// Voer database query uit: SELECT driver met gegeven ID
		const driverResult = await pool.query(
			'SELECT id, name, branch_id, status FROM drivers WHERE id = $1', 
			[id]
		)
		//error handling: driver staat niet in db
		if (driverResult.rows.length === 0) {
			return res.status(404).json({ error: `Driver ${id} niet gevonden` })
		}
		// UPDATE driver status naar 'ONLINE' via UPDATE query
		const updateLoginResult = await pool.query(
			`UPDATE drivers
				SET status = 'ONLINE'
				WHERE id = $1
				RETURNING id, name, branch_id, status`,
			[id]
		)
		// Verkrijg bijgewerkte driver data
		const driver = updateLoginResult.rows[0]
		// Log driver login event
		console.log(`[DRIVER STATUS] Driver #${driver.id} (${driver.name}) switched to ONLINE via login`)
		// Retourneer succesvolle login met driver info en ONLINE status
		return res.status(200).json({
			user: {
				role: 'driver', // User role
				driver_id: driver.id, // Driver ID
				driver_name: driver.name, // Driver volle naam
				branch_id: driver.branch_id, // Vestigings ID waar driver voor werkt
				status: driver.status // Status (ONLINE)
			}
		})
	} 
	// Error handling: als database query fails
	catch (err) {
		// Log error naar console voor debugging
		console.error('Login error:', err)
		return res.status(500).json({ error: 'Database error' })
	}
})

/**
 * LOGOUT ENDPOINT
 * POST /api/auth/logout: post method voor het aanpassen van status van online naar offline
 */
router.post('/logout', async function(req, res) {
	try {
		//body.parameters omzetten naar variabelen of lege objecten aanmaken
		const { role, identifier } = req.body || {}
		//is enkel voor de drivers
		if (role === 'driver') {
			// Zet identifier om naar nummer
			const id = Number(identifier)
			// Check of het een geldig positief integer is
			if (Number.isInteger(id) && id > 0) {
				// Voer UPDATE query uit: zet driver status naar OFFLINE
				const result = await pool.query(
					`UPDATE drivers
						SET status = 'OFFLINE'
						WHERE id = $1`,
					[id]
				)
				// als update lukt --> log event
				if (result.rowCount > 0) {
					console.log(`[DRIVER STATUS] Driver #${id} switched to OFFLINE via logout`)
				}
			}
		}
		//succes response
		return res.status(200).json({ ok: true })
	} 
	// Error handling: als database query fails
	catch (err) {
		// Log error naar console voor debugging
		console.error('Logout error:', err)
		return res.status(500).json({ error: 'Database error' })
	}
})

/**
 * MODULE EXPORT
 * Exporteer router zodat server.js het kan registreren op /api/auth
 */
module.exports = router