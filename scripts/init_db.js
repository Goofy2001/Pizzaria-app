const pool = require('../configs/database');

//maak tabel van vestigingen
function createTableBRANCH() {
    const query = `
        CREATE TABLE IF NOT EXISTS branch (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL UNIQUE,
            address TEXT NOT NULL,
            has_delivery BOOLEAN DEFAULT FALSE
        )
    `;
    return pool.query(query);
}

// maak tabel voor alle drivers
function createTableDRIVERS() {
    const query = `
        CREATE TABLE IF NOT EXISTS drivers (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            branch_id INTEGER NOT NULL,
            status VARCHAR(10) NOT NULL DEFAULT 'OFFLINE',
            latitude DOUBLE PRECISION,
            longitude DOUBLE PRECISION,
            last_location_update TIMESTAMP,

            CONSTRAINT valid_status CHECK (status IN ('ONLINE','OFFLINE')),
            CONSTRAINT fk_branch
                FOREIGN KEY (branch_id)
                REFERENCES branch(id)
        )
    `;
    return pool.query(query);
}

// maak tabel voor alle reservaties
function createTableRESERVATIONS() {
    const query = `
        CREATE TABLE IF NOT EXISTS reservations (
            id SERIAL PRIMARY KEY,
            customer_name VARCHAR(255) NOT NULL,
            customer_email VARCHAR(255) NOT NULL,
            customer_telephoneNumber VARCHAR(255) NOT NULL,
            created TIMESTAMP DEFAULT NOW(),
            date DATE NOT NULL,
            hour TIME NOT NULL,
            quantity INTEGER NOT NULL CHECK (quantity > 0 AND quantity <= 20),
            branch_id INTEGER NOT NULL,
            status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),

            CONSTRAINT fk_branch 
                FOREIGN KEY (branch_id)
                REFERENCES branch(id),
            CONSTRAINT unique_reservation
                UNIQUE (customer_email, date, hour, branch_id)
        )
    `;
    return pool.query(query);
}

// maak tabel voor bestellingen

function createTableORDERS() {
    const query = `
        CREATE TABLE IF NOT EXISTS orders (
            id SERIAL PRIMARY KEY,
            customer_name VARCHAR(255) NOT NULL,
            customer_email VARCHAR(255) NOT NULL,
            customer_telephoneNumber VARCHAR(255) NOT NULL,
            branch_id INTEGER NOT NULL,
            type VARCHAR(50) NOT NULL CHECK (type IN ('pick-up', 'delivery')),

            delivery_postalCode VARCHAR(4) DEFAULT NULL,
            delivery_municipality VARCHAR(50) DEFAULT NULL,
            delivery_streetName VARCHAR(50) DEFAULT NULL,
            delivery_houseNumber VARCHAR(10) DEFAULT NULL,

            created TIMESTAMP DEFAULT NOW(),
            requested_hour TIME NOT NULL,
            status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'on_route', 'delivered')),
            driver_id INTEGER DEFAULT NULL,
            delivery_started TIMESTAMP DEFAULT NULL,
            delivery_delivered TIMESTAMP DEFAULT NULL,

            CONSTRAINT fk_branch
                FOREIGN KEY (branch_id)
                REFERENCES branch(id),
            CONSTRAINT fk_driver
                FOREIGN KEY (driver_id)
                REFERENCES drivers(id)
        )
    `;
    return pool.query(query)
}

// tabellen moeten in de juiste volgerde gemaakt worden want anders: relation branch does not exist wanneer drivers worden gemaakt

async function init_db() {
    try {
        await createTableBRANCH()
        await createTableDRIVERS()
        await createTableRESERVATIONS()
        await createTableORDERS()
        console.log("Tabellen zijn met succes gemaakt")
    } catch(err) {
        console.error("Tabellen konden niet aangemaakt worden:", err)
    } finally {
        pool.end()
    }
}

init_db()