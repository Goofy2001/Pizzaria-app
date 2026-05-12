const { init_db } = require('./init_db')
const { fixTestDataTables } = require('./insert_testData')
const pool = require('../configs/database')

async function reset_db() {
    try {
        await init_db(false)
        await fixTestDataTables(false)
    } finally {
        await pool.end()
    }
}

module.exports = { reset_db }

if (require.main === module) {
    reset_db().catch((err) => {
        console.error('❌ Failed to reset database:', err)
        process.exitCode = 1
    })
}
