const pool = require('../configs/database')

// resetten van alle data in de tabellen
async function resetDataTables() {
    const query = `
        TRUNCATE TABLE
            branch,
            drivers,
            reservations,
            orders
        RESTART IDENTITY CASCADE
    `;
    await pool.query(query)
    console.log("Tables reset")
}


// test data toevoegen aan tabel branch
function insertTestDataBranch() {
    const query = `
        INSERT INTO branch (name, address, has_delivery)
        VALUES
            ('ANTICO MUNT', 'Muntstraat 16 Leuven', FALSE),
            ('ANTICO HAL5', 'Diestsesteenweg 104 Leuven', TRUE)
        ON CONFLICT DO NOTHING
        `;
    return pool.query(query)
}

// test data toevoegen aan tabel drivers
function insertTestDataDrivers() {
    const query = `
        INSERT INTO drivers (name, branch_id, status, latitude, longitude, last_location_update)
        VALUES
            ('Jan Peeters', 1, 'ONLINE', 50.8798, 4.7005, NOW()),
            ('Ali Hassan', 1, 'OFFLINE', NULL, NULL, NULL),
            ('Tom Jacobs', 2, 'ONLINE', 50.8600, 4.6850, NOW()),
            ('Lucas Maes', 2, 'OFFLINE', NULL, NULL, NULL)
    `;
    return pool.query(query);
}

// test data toevoegen aan tabel reservations
function insertTestDataReservations() {
    const query = `
        INSERT INTO reservations
        (customer_name, customer_email, customer_telephoneNumber, date, hour, quantity, branch_id)
        VALUES
            ('Emma Claes', 'emma.claes@mail.com', '0470123456', CURRENT_DATE + INTERVAL '1 day', '19:00', 2, 1),
            ('Noah Willems', 'noah.w@mail.com', '0488112233', CURRENT_DATE + INTERVAL '2 day', '20:00', 4, 1),
            ('Lotte Vermeulen', 'lotte.v@mail.com', '0499556677', CURRENT_DATE + INTERVAL '1 day', '18:30', 3, 2)
    `;
    return pool.query(query);
}

// test data toevoegen aan tabel orders
function insertTestDataOrders() {
    const query = `
        INSERT INTO orders
        (customer_name, customer_email, customer_telephoneNumber, branch_id, type,
         delivery_postalCode, delivery_municipality, delivery_streetName, delivery_houseNumber,
         requested_hour, status, driver_id, delivery_started, delivery_delivered)
        VALUES
            -- Pick-up order (geen driver nodig)
            ('Sarah De Smet', 'sarah@mail.com', '0477001122', 1, 'pick-up',
             NULL, NULL, NULL, NULL,
             '18:45', 'pending', NULL, NULL, NULL),

            -- Delivery bezig
            ('Milan Aerts', 'milan@mail.com', '0466112233', 2, 'delivery',
             '3000', 'Leuven', 'Bondgenotenlaan', 15,
             '19:15', 'preparing', 1, NOW(), NULL),

            -- Delivery afgerond
            ('Julie Van Damme', 'julie@mail.com', '0499121212', 2, 'delivery',
             '3001', 'Heverlee', 'Naamsesteenweg', 210,
             '17:30', 'delivered', 3, NOW() - INTERVAL '25 minutes', NOW())
    `;
    return pool.query(query);
}

async function insertAllTestData() {
    await insertTestDataBranch()
    console.log("Data voor branch is seeded")
    await insertTestDataDrivers()
    console.log("Data voor drivers is seeded")
    await insertTestDataReservations()
    console.log("Data voor reservations is seeded")
    await insertTestDataOrders()
    console.log("Test data zit in de tabellen")
}

async function fixTestDataTables() {
    try {
        await resetDataTables() //eerst verwijderen van de data
        await insertAllTestData() //daarna alle data toevoegen
        console.log("Datatables zijn succesvol gereset en gevuld")
        await pool.end()
    } catch(err) {
        console.error("Mislukt om datatables te seeden: ", err)
        await pool.end()
    }
}

fixTestDataTables()