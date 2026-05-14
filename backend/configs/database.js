// Import Pool class uit pg package voor database connections
const { Pool } = require('pg')

// Laden omgevingsvariabelen uit .env bestand
require('dotenv').config()

/**
 * DATABASE CONFIGURATION
 * Toggle tussen lokale en Supabase verbindingen
 * Geeft voorkeur aan supabase indien DATABASE_URL aanwezig in .env
 */

// Check of DATABASE_URL omgevingsvariabele ingesteld is en niet leeg (.trim)
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim())

// Omztten USE_SUPABASE .env variabele (string) naar boolean
const useSupabaseFlag = String(process.env.USE_SUPABASE || '').toLowerCase() === 'true'

// Bepaal of Supabase moet worden gebruikt: true als flag en DATABASE_URL aanwezig
const USE_SUPABASE = useSupabaseFlag && hasDatabaseUrl

/**
 * POOL CONFIGURATIE OPBOUW
 * Creëer verbindingsconfiguratie gebaseerd op USE_SUPABASE toggle
 */

// Configuratie voor Supabase (cloud-gehoste PostgreSQL)
const supabaseConfig = {
    connectionString: process.env.DATABASE_URL, // Full connection string van Supabase
    ssl: false // SSL disabled 
}

// Configuratie voor lokale PostgreSQL database
const localConfig = {
    user: process.env.PGUSER || 'postgres', // Database gebruiker (default: postgres)
    host: process.env.PGHOST || 'localhost', // Database host (default: localhost)
    database: process.env.PGDATABASE || 'pizzeria', // Database naam (default: pizzeria)
    password: process.env.PGPASSWORD || process.env.postgreSQLww, // Database wachtwoord
    port: Number(process.env.PGPORT || 5432) // Database port (default: 5432)
}

// Kies configuratie gebaseerd op USE_SUPABASE toggle --> als supabase true: gebruik supabaseconfig als poolconfig
const poolConfig = USE_SUPABASE ? supabaseConfig : localConfig

/**
 * DEBUG OUTPUT
 * Log verbindingsdetails voor troubleshooting (zonder gevoelige gegevens)
 */
console.log(`📡 Connecting to: ${USE_SUPABASE ? 'Supabase (DATABASE_URL)' : 'Local/PG_* vars'}`) //console welke database worddt gebruikt
console.log(`USE_SUPABASE=${USE_SUPABASE ? 'true' : 'false'}`) //waarde van variabele
console.log(`DATABASE_URL=${hasDatabaseUrl ? 'present' : 'missing'}`) //aanwezigheid van variabele

/**
 * CONNECTION POOL CREATIE
 * Maak één gedeelde PostgreSQL connection pool voor hele backend
 * Pool beheert automatisch connections: openen, sluiten, recyclen
 */
const pool = new Pool(poolConfig) //connection maken op basis van supabase of lokale db

/**
 * TEST DATABASE VERBINDING
 * Voer simpele query uit om verbinding te testen bij server start
 */
pool.query('select now()', function(err, res) {
    // Als error: log en toon verbindingsfout
    if(err) {
        console.error("Database connection is mislukt: ", err)
    }
    // Als succes: toon server datum/tijd van database
    else {
        console.log("Database verbonden", res.rows[0])
    }
})

/**
 * ERROR HANDLING
 * Luister naar onverwachte fouten op inactieve clients
 */
pool.on('error', function(err) {
    // Log elke onverwachte error op idle client connections
    console.error('Onverwachte database fout op idle client:', err)
})

/**
 * MODULE EXPORT
 * Exporteer pool object zodat routes het kunnen gebruiken
 * Alle routes importeren dit bestand en gebruiken pool.query()
 */
module.exports = pool