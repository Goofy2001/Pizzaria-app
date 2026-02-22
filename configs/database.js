const { Pool } = require('pg')

// database configuration
const pool = new Pool({
    user: 'goofy2001',
    host: 'localhost',
    database: 'pizzeria',
    password: process.env.postgreSQLww,
    port: 5432
})

//test de connectie met de database
pool.query('select now()', function(err, res) {
    if(err) {console.error("Database connection is mislukt: ", err)}
    else {console.log("Database verbonden", res.rows[0])}
})

// maakt functie global
module.exports = pool