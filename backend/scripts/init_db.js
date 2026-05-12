const pool = require('../configs/database');

// Tabel: Vestigingen
// Create branch table.
function createTableBRANCH() {
    const query = `
        CREATE TABLE IF NOT EXISTS branch (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL UNIQUE,
            address TEXT NOT NULL,
            has_delivery BOOLEAN DEFAULT FALSE,
            has_inHouse BOOLEAN DEFAULT FALSE,
            has_pickUp BOOLEAN DEFAULT FALSE,
            latitude DOUBLE PRECISION,
            longitude DOUBLE PRECISION,
            created_at TIMESTAMP DEFAULT NOW()
        )
    `;
    return pool.query(query);
}

// Tabel: Drivers
// Create drivers table.
function createTableDRIVERS() {
    const query = `
        CREATE TABLE IF NOT EXISTS drivers (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            branch_id INTEGER NOT NULL,
            status VARCHAR(10) NOT NULL DEFAULT 'OFFLINE',
            on_route BOOLEAN DEFAULT FALSE,
            latitude DOUBLE PRECISION,
            longitude DOUBLE PRECISION,
            last_location_update TIMESTAMP,
            created_at TIMESTAMP DEFAULT NOW(),

            CONSTRAINT valid_status CHECK (status IN ('ONLINE','OFFLINE')),
            CONSTRAINT fk_branch
                FOREIGN KEY (branch_id)
                REFERENCES branch(id)
                ON DELETE CASCADE
        )
    `;
    return pool.query(query);
}

// Tabel: Reservaties
// Create reservations table.
function createTableRESERVATIONS() {
    const query = `
        CREATE TABLE IF NOT EXISTS reservations (
            id SERIAL PRIMARY KEY,
            customer_name VARCHAR(255) NOT NULL,
            customer_email VARCHAR(255) NOT NULL,
            customer_telephonenumber VARCHAR(20) NOT NULL,
            branch_id INTEGER NOT NULL,
            date DATE NOT NULL,
            hour TIME NOT NULL,
            quantity INTEGER NOT NULL CHECK (quantity > 0 AND quantity <= 20),
            opmerking TEXT,
            status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
            created_at TIMESTAMP DEFAULT NOW(),

            CONSTRAINT fk_branch 
                FOREIGN KEY (branch_id)
                REFERENCES branch(id)
                ON DELETE CASCADE
        )
    `;
    return pool.query(query);
}

// Tabel: Bestellingen
// Create orders table.
function createTableORDERS() {
    const query = `
        CREATE TABLE IF NOT EXISTS orders (
            id SERIAL PRIMARY KEY,
            customer_name VARCHAR(255) NOT NULL,
            customer_email VARCHAR(255) NOT NULL,
            customer_telephonenumber VARCHAR(20) NOT NULL,
            branch_id INTEGER NOT NULL,
            type VARCHAR(50) NOT NULL CHECK (type IN ('inHouse','pickup', 'delivery')),
            
            -- Delivery address (nullable voor pickup)
            delivery_postalcode VARCHAR(4),
            delivery_municipality VARCHAR(50),
            delivery_streetname VARCHAR(50),
            delivery_housenumber VARCHAR(10),
            
            -- Timestamps
            created TIMESTAMP DEFAULT NOW(),
            requested_hour TIME NOT NULL,
            delivery_started TIMESTAMP,
            delivery_delivered TIMESTAMP,
            
            -- Status & assignment
            status VARCHAR(50) DEFAULT 'pending' 
                CHECK (status IN ('pending', 'paid', 'preparing', 'ready','picked_up','on_table', 'loaded_for_delivery', 'on_route', 'delivered', 'cancelled')),
            driver_id INTEGER,
            
            CONSTRAINT fk_branch
                FOREIGN KEY (branch_id)
                REFERENCES branch(id)
                ON DELETE CASCADE,
            CONSTRAINT fk_driver
                FOREIGN KEY (driver_id)
                REFERENCES drivers(id)
                ON DELETE SET NULL
        )
    `;
    return pool.query(query);
}

// Tabel: GPS Tracking (voor real-time tracking)
// Create gps_tracking table.
function createTableGPS_TRACKING() {
    const query = `
        CREATE TABLE IF NOT EXISTS gps_tracking (
            id SERIAL PRIMARY KEY,
            driver_id INTEGER NOT NULL,
            order_id INTEGER,
            latitude DOUBLE PRECISION NOT NULL,
            longitude DOUBLE PRECISION NOT NULL,
            timestamp TIMESTAMP DEFAULT NOW(),
            
            CONSTRAINT fk_driver
                FOREIGN KEY (driver_id)
                REFERENCES drivers(id)
                ON DELETE CASCADE,
            CONSTRAINT fk_order
                FOREIGN KEY (order_id)
                REFERENCES orders(id)
                ON DELETE CASCADE
        )
    `;
    return pool.query(query);
}

// Tabel: Leveringen History (voor analytics/heat maps)
// Create delivery_history table.
function createTableDELIVERY_HISTORY() {
    const query = `
        CREATE TABLE IF NOT EXISTS delivery_history (
            id SERIAL PRIMARY KEY,
            branch_id INTEGER NOT NULL,
            order_id INTEGER,
            
            -- Route info
            start_lat DOUBLE PRECISION,
            start_lon DOUBLE PRECISION,
            end_lat DOUBLE PRECISION NOT NULL,
            end_lon DOUBLE PRECISION NOT NULL,
            
            -- Metrics
            distance_km DECIMAL(5,2),
            time_minutes INTEGER,
            
            -- Timestamps
            started_on TIMESTAMP,
            delivered_on TIMESTAMP DEFAULT NOW(),
            
            CONSTRAINT fk_vestiging
                FOREIGN KEY (branch_id)
                REFERENCES branch(id)
                ON DELETE CASCADE,
            CONSTRAINT fk_order
                FOREIGN KEY (order_id)
                REFERENCES orders(id)
                ON DELETE SET NULL
        )
    `;
    return pool.query(query);
}

// Initialize alle tabellen in juiste volgorde
// Main initialization flow with logging.
async function init_db(closePool = true) {
    try {
        console.log('🔵 Starting database initialization...\n');
        
        await createTableBRANCH();
        console.log('✅ Table created: branch');
        
        await createTableDRIVERS();
        console.log('✅ Table created: drivers');
        
        await createTableRESERVATIONS();
        console.log('✅ Table created: reservations');
        
        await createTableORDERS();
        console.log('✅ Table created: orders');
        
        await createTableGPS_TRACKING();
        console.log('✅ Table created: gps_tracking');
        
        await createTableDELIVERY_HISTORY();
        console.log('✅ Table created: delivery_history');
        
        console.log('\n🎉 All tables created successfully!');
    } catch(err) {
        console.error('❌ Error creating tables:', err);
    } finally {
        if (closePool) {
            await pool.end();
        }
    }
}

module.exports = { init_db }

if (require.main === module) {
    init_db();
}