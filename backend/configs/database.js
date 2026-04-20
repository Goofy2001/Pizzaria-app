const { Pool } = require('pg')

// database configuration
// Create one shared PostgreSQL connection pool for the whole backend.
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

// Listen for unexpected errors on idle clients.
pool.on('error', function(err) {
    console.error('Onverwachte database fout op idle client:', err)
})

// maakt functie global
module.exports = pool