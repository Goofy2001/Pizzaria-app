/**
 * DROP TABLES SCRIPT
 * Doel: Utility script om alle database tables te verwijderen
 */

const pool = require('../configs/database') //database connectie maken

// verwijderen van de tabellen indien ik het wil (tijdelijke oplossing)
async function deleteTables() {
    try {
        const query = `
        DROP TABLE IF EXISTS orders CASCADE;
        DROP TABLE IF EXISTS reservations CASCADE;
        DROP TABLE IF EXISTS drivers CASCADE;
        DROP TABLE IF EXISTS branch CASCADE;
        DROP TABLE IF EXISTS gps_tracking CASCADE;
        `;
        await pool.query(query)
        console.log("Alle tabellen zijn verwijderd")
    } catch(err) {
        console.error(err)
    } finally {
        pool.end()
    }
}

// Run script immediately when file is executed with Node.
deleteTables()