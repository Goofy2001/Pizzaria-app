const { Pool } = require('pg')

// instellen van de database
// Maak connectie met database aan de hand van de .env
const pool = new Pool({
    user: process.env.PGUSER || 'postgres',
    host: process.env.PGHOST || 'localhost',
    database: process.env.PGDATABASE || 'pizzeria',
    password: process.env.PGPASSWORD || process.env.postgreSQLww,
    port: Number(process.env.PGPORT || 5432)
})

//test de connectie met de database
pool.query('select now()', function(err, res) {
    if(err) {console.error("Database connection is mislukt: ", err)}
    else {console.log("Database verbonden", res.rows[0])}
})

// luister voor error en geef een foutmelding
pool.on('error', function(err) {
    console.error('Onverwachte database fout op idle client:', err)
})

// maak de functie "pool" globaal zodat deze te gebruiken is overal
module.exports = pool