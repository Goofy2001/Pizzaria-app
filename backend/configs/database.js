const { Pool } = require('pg')
require('dotenv').config()

// database configuration
// Toggle between local and Supabase connections.
// Prefer an explicit DATABASE_URL when present.
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim())
const useSupabaseFlag = String(process.env.USE_SUPABASE || '').toLowerCase() === 'true'
const USE_SUPABASE = useSupabaseFlag || hasDatabaseUrl

// Create pool configuration based on toggle
const poolConfig = USE_SUPABASE ? {
    connectionString: process.env.DATABASE_URL,
    ssl: false
} : {
    user: process.env.PGUSER || 'postgres',
    host: process.env.PGHOST || 'localhost',
    database: process.env.PGDATABASE || 'pizzeria',
    password: process.env.PGPASSWORD || process.env.postgreSQLww,
    port: Number(process.env.PGPORT || 5432)
}

console.log(`📡 Connecting to: ${USE_SUPABASE ? 'Supabase (DATABASE_URL)' : 'Local/PG_* vars'}`)
console.log(`   USE_SUPABASE=${process.env.USE_SUPABASE || '(missing)'}`)
console.log(`   DATABASE_URL=${hasDatabaseUrl ? 'present' : '(missing)'}`)
if (USE_SUPABASE) {
    console.log(`   DATABASE_URL: ${process.env.DATABASE_URL?.substring(0, 60)}...`)
}

// Create one shared PostgreSQL connection pool for the whole backend.
const pool = new Pool(poolConfig)

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