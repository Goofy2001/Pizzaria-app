const pool = require('../configs/database');

// verwijderen van de tabellen indien ik het wil (tijdelijke oplossing)
async function deleteTables() {
    try {
        const query = `
        DROP TABLE IF EXISTS orders CASCADE;
        DROP TABLE IF EXISTS reservations CASCADE;
        DROP TABLE IF EXISTS drivers CASCADE;
        DROP TABLE IF EXISTS branch CASCADE;
        `;
        await pool.query(query)
        console.log("Alle tabellen zijn verwijderd")
    } catch(err) {
        console.error(err)
    } finally {
        pool.end()
    }
}

deleteTables()