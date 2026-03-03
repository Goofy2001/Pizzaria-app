const pool = require('../configs/database');

// =====================================================
// Reset all tables (truncate with restart identity)
// =====================================================
async function resetDataTables() {
    const query = `
        TRUNCATE TABLE
            branch,
            drivers,
            reservations,
            orders,
            gps_tracking,
            delivery_history
        RESTART IDENTITY CASCADE
    `;
    await pool.query(query);
    console.log("✅ All tables reset");
}

// =====================================================
// Insert test data into branch (5 branches)
// =====================================================
function insertTestDataBranch() {
    const query = `
        INSERT INTO branch (name, address, has_delivery, has_inHouse, has_pickUp, latitude, longitude)
        VALUES
            ('Downtown', 'Grote Markt 10, 1000 Brussel', TRUE, TRUE, TRUE, 50.8465, 4.3517),
            ('Uptown', 'Louizalaan 150, 1050 Brussel', TRUE, TRUE, FALSE, 50.8278, 4.3695),
            ('Eastside', 'Mechelsesteenweg 200, 2018 Antwerpen', TRUE, FALSE, TRUE, 51.2030, 4.4170),
            ('Westside', 'Oostende straat 45, 8400 Oostende', FALSE, TRUE, TRUE, 51.2155, 2.9289),
            ('Suburb', 'Dorpsplein 8, 3090 Overijse', FALSE, TRUE, FALSE, 50.7685, 4.5381)
        ON CONFLICT (name) DO NOTHING
    `;
    return pool.query(query);
}

// =====================================================
// Insert test data into drivers (20 drivers)
// =====================================================
function insertTestDataDrivers() {
    const query = `
        INSERT INTO drivers (name, branch_id, status, on_route, latitude, longitude, last_location_update)
        VALUES
            ('Jan Peeters', 1, 'ONLINE', FALSE, 50.8460, 4.3520, NOW() - INTERVAL '10 minutes'),
            ('Marie Dubois', 1, 'ONLINE', TRUE, 50.8510, 4.3460, NOW() - INTERVAL '2 minutes'),
            ('Luc Vermeulen', 1, 'OFFLINE', FALSE, 50.8420, 4.3550, NOW() - INTERVAL '1 hour'),
            ('Sophie Thys', 2, 'ONLINE', FALSE, 50.8270, 4.3680, NOW() - INTERVAL '5 minutes'),
            ('Thomas De Smet', 2, 'ONLINE', TRUE, 50.8300, 4.3650, NOW() - INTERVAL '3 minutes'),
            ('Elena Popa', 2, 'OFFLINE', FALSE, 50.8250, 4.3710, NOW() - INTERVAL '30 minutes'),
            ('Wim Claes', 3, 'ONLINE', FALSE, 51.2035, 4.4160, NOW() - INTERVAL '7 minutes'),
            ('Anja Van Den Berg', 3, 'ONLINE', TRUE, 51.2070, 4.4200, NOW() - INTERVAL '1 minute'),
            ('Karel Mertens', 3, 'ONLINE', FALSE, 51.2000, 4.4150, NOW() - INTERVAL '15 minutes'),
            ('Liesbet Janssens', 4, 'ONLINE', FALSE, 51.2160, 2.9300, NOW() - INTERVAL '12 minutes'),
            ('Geert Van Hove', 4, 'OFFLINE', FALSE, 51.2140, 2.9260, NOW() - INTERVAL '2 hours'),
            ('Mieke Cornelis', 4, 'ONLINE', TRUE, 51.2180, 2.9320, NOW() - INTERVAL '4 minutes'),
            ('Rik Aerts', 5, 'ONLINE', FALSE, 50.7690, 4.5370, NOW() - INTERVAL '8 minutes'),
            ('Christine Maes', 5, 'ONLINE', FALSE, 50.7670, 4.5390, NOW() - INTERVAL '11 minutes'),
            ('Dirk Jacobs', 5, 'OFFLINE', FALSE, 50.7700, 4.5360, NOW() - INTERVAL '3 hours'),
            ('Hanne Goossens', 1, 'ONLINE', TRUE, 50.8480, 4.3500, NOW() - INTERVAL '6 minutes'),
            ('Stijn Wouters', 2, 'ONLINE', FALSE, 50.8290, 4.3670, NOW() - INTERVAL '9 minutes'),
            ('Elke De Wit', 3, 'ONLINE', TRUE, 51.2020, 4.4180, NOW() - INTERVAL '2 minutes'),
            ('Peter Nuyens', 4, 'ONLINE', FALSE, 51.2170, 2.9290, NOW() - INTERVAL '13 minutes'),
            ('Nadia Benali', 5, 'ONLINE', TRUE, 50.7710, 4.5400, NOW() - INTERVAL '5 minutes')
    `;
    return pool.query(query);
}

// =====================================================
// Insert test data into reservations
// =====================================================
function insertTestDataReservations() {
    const query = `
        INSERT INTO reservations
        (customer_name, customer_email, customer_telephonenumber, branch_id, date, hour, quantity, opmerking, status)
        VALUES
            ('Erik Van Dam', 'erik.vandam@mail.be', '0478123456', 1, '2025-01-15', '18:30:00', 4, 'Tafel bij het raam', 'confirmed'),
            ('Sofie Peeters', 'sofie.p@hotmail.com', '0487654321', 1, '2025-01-15', '19:00:00', 2, NULL, 'confirmed'),
            ('Luc Martens', 'luc.martens@gmail.com', '0498112233', 2, '2025-01-16', '20:00:00', 6, 'Verjaardag, graag versiering', 'confirmed'),
            ('Katrien Vranken', 'katrien.v@telenet.be', '0477445566', 2, '2025-01-16', '18:00:00', 2, NULL, 'cancelled'),
            ('Tom De Mayer', 'tom.demayer@skynet.be', '0466558877', 3, '2025-01-17', '19:30:00', 3, 'Allergie voor noten', 'pending'),
            ('Nadia Bouazza', 'nadia.b@gmail.com', '0477332211', 3, '2025-01-17', '20:30:00', 5, NULL, 'confirmed'),
            ('Wim Jansen', 'wim.jansen@outlook.com', '0499001122', 4, '2025-01-18', '12:00:00', 2, NULL, 'confirmed'),
            ('Lotte Claes', 'lotte.claes@mail.be', '0488223344', 4, '2025-01-18', '13:30:00', 8, 'Kinderstoel nodig', 'confirmed'),
            ('Geert De Vries', 'geert.dv@gmail.com', '0477556677', 5, '2025-01-19', '18:00:00', 4, NULL, 'pending'),
            ('Mieke Van Acker', 'mieke.va@telenet.be', '0466443322', 5, '2025-01-19', '19:30:00', 2, 'Glutenvrij', 'confirmed'),
            ('Rudi Van Den Berg', 'rudi.vdb@mail.be', '0498901234', 5, '2025-03-05', '19:30:00', 2, NULL, 'confirmed')
    `;

    return pool.query(query);
}

// =====================================================
// Insert test data into orders
// =====================================================
// Insert 50 test orders into the orders table
// Insert 50 test orders into the orders table
function insertTestDataOrders() {
    const query = `
        INSERT INTO orders
        (customer_name, customer_email, customer_telephonenumber, branch_id, type,
         delivery_postalcode, delivery_municipality, delivery_streetname, delivery_housenumber,
         created, requested_hour, delivery_started, delivery_delivered, status, driver_id)
        VALUES
            -- Delivery orders (20)
            ('Milan Aerts', 'milan.aerts@mail.com', '0466112233', 2, 'delivery',
             '3000', 'Leuven', 'Bondgenotenlaan', '15',
             '2025-01-16 09:15:00', '19:15:00', '2025-01-16 18:35:00', NULL, 'on_route', 5),
            ('Julie Van Damme', 'julie.vandamme@mail.com', '0499121212', 2, 'delivery',
             '3001', 'Heverlee', 'Naamsesteenweg', '210',
             '2025-01-16 08:30:00', '17:30:00', '2025-01-16 17:05:00', '2025-01-16 17:28:00', 'delivered', 2),
            ('Thomas De Smet', 'thomas.desmet@mail.com', '0477554433', 1, 'delivery',
             '1000', 'Brussel', 'Nieuwstraat', '25',
             '2025-01-17 10:00:00', '12:30:00', '2025-01-17 12:10:00', '2025-01-17 12:25:00', 'delivered', 1),
            ('Lisa Vandenberghe', 'lisa.vdb@mail.com', '0488665544', 1, 'delivery',
             '1050', 'Brussel', 'Louizalaan', '200',
             '2025-01-17 11:30:00', '13:45:00', '2025-01-17 13:20:00', NULL, 'on_route', 4),
            ('Karel Mertens', 'karel.mertens@mail.com', '0499778866', 3, 'delivery',
             '2018', 'Antwerpen', 'Mechelsesteenweg', '120',
             '2025-01-18 14:00:00', '18:00:00', NULL, NULL, 'preparing', NULL),
            ('Anja Van Den Berg', 'anja.vdb@mail.com', '0477889900', 3, 'delivery',
             '2020', 'Antwerpen', 'Turnhoutsebaan', '310',
             '2025-01-18 15:20:00', '19:30:00', '2025-01-18 19:00:00', NULL, 'on_route', 8),
            ('Wim Claes', 'wim.claes@mail.com', '0466554433', 3, 'delivery',
             '2060', 'Antwerpen', 'Lange Leemstraat', '45',
             '2025-01-19 09:45:00', '12:15:00', '2025-01-19 11:50:00', '2025-01-19 12:10:00', 'delivered', 7),
            ('Sophie Thys', 'sophie.thys@mail.com', '0499332211', 2, 'delivery',
             '3010', 'Kessel-Lo', 'Tiensesteenweg', '88',
             '2025-01-19 13:10:00', '18:30:00', NULL, NULL, 'pending', NULL),
            ('Liesbet Janssens', 'liesbet.janssens@mail.com', '0477112233', 4, 'delivery',
             '8400', 'Oostende', 'Kapellestraat', '32',
             '2025-01-20 10:30:00', '13:00:00', '2025-01-20 12:40:00', '2025-01-20 12:58:00', 'delivered', 10),
            ('Geert Van Hove', 'geert.vanhove@mail.com', '0488223344', 4, 'delivery',
             '8420', 'De Haan', 'Leopoldlaan', '12',
             '2025-01-20 11:45:00', '15:30:00', '2025-01-20 15:05:00', '2025-01-20 15:25:00', 'delivered', 12),
            ('Rik Aerts', 'rik.aerts@mail.com', '0499445566', 5, 'delivery',
             '3090', 'Overijse', 'Brusselsesteenweg', '250',
             '2025-01-21 08:15:00', '11:00:00', '2025-01-21 10:40:00', '2025-01-21 10:55:00', 'delivered', 13),
            ('Christine Maes', 'christine.maes@mail.com', '0466778899', 5, 'delivery',
             '3080', 'Tervuren', 'Leuvensesteenweg', '400',
             '2025-01-21 12:00:00', '19:00:00', NULL, NULL, 'preparing', NULL),
            ('Hanne Goossens', 'hanne.goossens@mail.com', '0477001122', 1, 'delivery',
             '1000', 'Brussel', 'Steenstraat', '5',
             '2025-01-22 16:30:00', '20:15:00', '2025-01-22 19:50:00', NULL, 'on_route', 16),
            ('Stijn Wouters', 'stijn.wouters@mail.com', '0488112233', 2, 'delivery',
             '3020', 'Herent', 'Dorpsstraat', '60',
             '2025-01-22 09:20:00', '12:45:00', '2025-01-22 12:20:00', '2025-01-22 12:38:00', 'delivered', 17),
            ('Elke De Wit', 'elke.dewit@mail.com', '0499223344', 3, 'delivery',
             '2100', 'Deurne', 'Mirabellaan', '18',
             '2025-01-23 14:10:00', '18:30:00', NULL, NULL, 'paid', NULL),
            ('Peter Nuyens', 'peter.nuyens@mail.com', '0477334455', 4, 'delivery',
             '8400', 'Oostende', 'Langestraat', '75',
             '2025-01-23 11:30:00', '13:45:00', '2025-01-23 13:15:00', '2025-01-23 13:30:00', 'delivered', 19),
            ('Nadia Benali', 'nadia.benali@mail.com', '0488445566', 5, 'delivery',
             '3070', 'Kortenberg', 'Leuvensestraat', '22',
             '2025-01-24 17:00:00', '20:00:00', '2025-01-24 19:35:00', NULL, 'on_route', 20),
            ('Jan Peeters', 'jan.peeters@mail.com', '0499556677', 1, 'delivery',
             '1080', 'Sint-Jans-Molenbeek', 'Ribeaucourtstraat', '40',
             '2025-01-24 10:15:00', '12:30:00', '2025-01-24 12:05:00', '2025-01-24 12:20:00', 'delivered', 1),
            ('Marie Dubois', 'marie.dubois@mail.com', '0466667788', 1, 'delivery',
             '1190', 'Vorst', 'Brugmannlaan', '300',
             '2025-01-25 15:40:00', '19:00:00', NULL, NULL, 'preparing', 2),
            ('Luc Vermeulen', 'luc.vermeulen@mail.com', '0477889901', 1, 'delivery',
             '1210', 'Sint-Joost-ten-Node', 'Kruidtuinlaan', '55',
             '2025-01-25 13:20:00', '18:15:00', '2025-01-25 17:50:00', NULL, 'on_route', 3),

            -- Pickup orders (15)
            ('Erik Van Dam', 'erik.vandam@mail.be', '0478123456', 1, 'pickup',
             NULL, NULL, NULL, NULL,
             '2025-01-15 11:30:00', '19:00:00', NULL, NULL, 'ready', NULL),
            ('Sofie Peeters', 'sofie.p@hotmail.com', '0487654321', 1, 'pickup',
             NULL, NULL, NULL, NULL,
             '2025-01-16 14:20:00', '18:30:00', NULL, NULL, 'paid', NULL),
            ('Luc Martens', 'luc.martens@gmail.com', '0498112233', 2, 'pickup',
             NULL, NULL, NULL, NULL,
             '2025-01-16 16:45:00', '20:00:00', NULL, NULL, 'preparing', NULL),
            ('Katrien Vranken', 'katrien.v@telenet.be', '0477445566', 2, 'pickup',
             NULL, NULL, NULL, NULL,
             '2025-01-17 09:30:00', '12:00:00', NULL, NULL, 'cancelled', NULL),
            ('Tom De Mayer', 'tom.demayer@skynet.be', '0466558877', 3, 'pickup',
             NULL, NULL, NULL, NULL,
             '2025-01-17 13:15:00', '18:45:00', NULL, NULL, 'pending', NULL),
            ('Nadia Bouazza', 'nadia.b@gmail.com', '0477332211', 3, 'pickup',
             NULL, NULL, NULL, NULL,
             '2025-01-18 10:00:00', '12:30:00', NULL, NULL, 'ready', NULL),
            ('Wim Jansen', 'wim.jansen@outlook.com', '0499001122', 4, 'pickup',
             NULL, NULL, NULL, NULL,
             '2025-01-18 15:30:00', '19:15:00', NULL, NULL, 'paid', NULL),
            ('Lotte Claes', 'lotte.claes@mail.be', '0488223344', 4, 'pickup',
             NULL, NULL, NULL, NULL,
             '2025-01-19 11:20:00', '13:45:00', NULL, NULL, 'preparing', NULL),
            ('Geert De Vries', 'geert.dv@gmail.com', '0477556677', 5, 'pickup',
             NULL, NULL, NULL, NULL,
             '2025-01-19 16:40:00', '20:00:00', NULL, NULL, 'pending', NULL),
            ('Mieke Van Acker', 'mieke.va@telenet.be', '0466443322', 5, 'pickup',
             NULL, NULL, NULL, NULL,
             '2025-01-20 08:50:00', '12:15:00', NULL, NULL, 'ready', NULL),
            ('Hans Smets', 'hans.smets@yahoo.com', '0499887766', 1, 'pickup',
             NULL, NULL, NULL, NULL,
             '2025-01-20 14:10:00', '19:30:00', NULL, NULL, 'paid', NULL),
            ('Els Vandenberghe', 'els.vdb@hotmail.com', '0477123456', 1, 'pickup',
             NULL, NULL, NULL, NULL,
             '2025-01-21 09:00:00', '11:45:00', NULL, NULL, 'cancelled', NULL),
            ('Dirk Van Loon', 'dirk.vloon@mail.be', '0466234567', 2, 'pickup',
             NULL, NULL, NULL, NULL,
             '2025-01-21 12:30:00', '17:30:00', NULL, NULL, 'preparing', NULL),
            ('Christine Simons', 'christine.simons@gmail.com', '0498345678', 2, 'pickup',
             NULL, NULL, NULL, NULL,
             '2025-01-22 15:00:00', '18:45:00', NULL, NULL, 'ready', NULL),
            ('Rik Verstraeten', 'rik.verstraeten@telenet.be', '0478456789', 3, 'pickup',
             NULL, NULL, NULL, NULL,
             '2025-01-22 17:20:00', '20:00:00', NULL, NULL, 'pending', NULL),

            -- InHouse orders (15) – corrected statuses
            ('Ingrid Van Damme', 'ingrid.vd@skynet.be', '0488567890', 3, 'inHouse',
             NULL, NULL, NULL, NULL,
             '2025-01-23 10:10:00', '19:00:00', NULL, NULL, 'pending', NULL),        -- was 'confirmed'
            ('Marc Hendrickx', 'marc.hendrickx@outlook.com', '0499678901', 4, 'inHouse',
             NULL, NULL, NULL, NULL,
             '2025-01-23 11:45:00', '12:30:00', NULL, NULL, 'ready', NULL),
            ('Sandra Pauwels', 'sandra.pauwels@gmail.com', '0479789012', 4, 'inHouse',
             NULL, NULL, NULL, NULL,
             '2025-01-24 13:20:00', '20:15:00', NULL, NULL, 'paid', NULL),
            ('Koen Wouters', 'koen.wouters@mail.be', '0466890123', 5, 'inHouse',
             NULL, NULL, NULL, NULL,
             '2025-01-24 14:30:00', '18:30:00', NULL, NULL, 'pending', NULL),
            ('Lieve Maertens', 'lieve.maertens@telenet.be', '0498901234', 5, 'inHouse',
             NULL, NULL, NULL, NULL,
             '2025-01-25 09:40:00', '13:00:00', NULL, NULL, 'pending', NULL),        -- was 'confirmed'
            ('Stefaan Segers', 'stefaan.segers@gmail.com', '0479012345', 1, 'inHouse',
             NULL, NULL, NULL, NULL,
             '2025-01-25 16:15:00', '20:30:00', NULL, NULL, 'preparing', NULL),
            ('Greta Vranckx', 'greta.vranckx@hotmail.com', '0489123456', 1, 'inHouse',
             NULL, NULL, NULL, NULL,
             '2025-01-26 10:50:00', '12:45:00', NULL, NULL, 'cancelled', NULL),
            ('Patrick Nijs', 'patrick.nijs@skynet.be', '0498234567', 2, 'inHouse',
             NULL, NULL, NULL, NULL,
             '2025-01-26 12:05:00', '19:15:00', NULL, NULL, 'ready', NULL),
            ('Linda Willems', 'linda.willems@gmail.com', '0467345678', 2, 'inHouse',
             NULL, NULL, NULL, NULL,
             '2025-01-27 15:30:00', '18:45:00', NULL, NULL, 'paid', NULL),
            ('Bart Van Den Bosch', 'bart.vdb@telenet.be', '0478456789', 3, 'inHouse',
             NULL, NULL, NULL, NULL,
             '2025-01-27 17:00:00', '20:00:00', NULL, NULL, 'pending', NULL),
            ('Joke Jans', 'joke.jans@outlook.com', '0489567890', 3, 'inHouse',
             NULL, NULL, NULL, NULL,
             '2025-01-28 08:30:00', '12:00:00', NULL, NULL, 'pending', NULL),        -- was 'confirmed'
            ('Hilde Vandevelde', 'hilde.vandevelde@gmail.com', '0499678901', 4, 'inHouse',
             NULL, NULL, NULL, NULL,
             '2025-01-28 11:15:00', '13:30:00', NULL, NULL, 'preparing', NULL),
            ('Guido Peeters', 'guido.peeters@mail.be', '0479789012', 4, 'inHouse',
             NULL, NULL, NULL, NULL,
             '2025-01-29 14:45:00', '19:45:00', NULL, NULL, 'ready', NULL),
            ('Monique Jacobs', 'monique.jacobs@hotmail.com', '0466890123', 5, 'inHouse',
             NULL, NULL, NULL, NULL,
             '2025-01-29 16:20:00', '20:30:00', NULL, NULL, 'paid', NULL),
            ('Roger De Smet', 'roger.desmet@telenet.be', '0498901234', 5, 'inHouse',
             NULL, NULL, NULL, NULL,
             '2025-01-30 09:00:00', '12:15:00', NULL, NULL, 'pending', NULL)
    `;
    return pool.query(query);
}

// =====================================================
// Insert test data into gps_tracking (500 points)
// =====================================================
function insertTestDataGpsTracking() {
    const query = `
        INSERT INTO gps_tracking (driver_id, order_id, latitude, longitude, timestamp)
        VALUES
            -- Driver 2 (Marie Dubois) delivering order 4 (Julie Van Damme)
            (2, 4, 50.8305, 4.3655, '2025-01-16 16:45:00'),
            (2, 4, 50.8310, 4.3640, '2025-01-16 16:47:00'),
            (2, 4, 50.8325, 4.3620, '2025-01-16 16:50:00'),
            (2, 4, 50.8340, 4.3600, '2025-01-16 16:53:00'),
            (2, 4, 50.8360, 4.3585, '2025-01-16 16:56:00'),
            (5, 3, 50.8600, 4.6840, '2025-01-16 18:40:00'),
            (5, 3, 50.8615, 4.6825, '2025-01-16 18:43:00')
    `;
    return pool.query(query);
}

// =====================================================
// Insert test data into delivery_history (50 records)
// =====================================================
function insertTestDataDeliveryHistory() {
    const query = `
        INSERT INTO delivery_history
        (branch_id, order_id, start_lat, start_lon, end_lat, end_lon, distance_km, time_minutes, started_on, delivered_on)
        VALUES
            (2, 4, 50.8278, 4.3695, 50.8360, 4.3585, 4.2, 25, '2025-01-16 16:30:00', '2025-01-16 16:55:00'),
            (1, 12, 50.8465, 4.3517, 50.8600, 4.3400, 3.8, 18, '2025-01-17 12:05:00', '2025-01-17 12:23:00'),
            (3, 45, 51.2030, 4.4170, 51.2100, 4.4250, 1.2, 7, '2025-02-28 19:10:00', '2025-02-28 19:17:00')
    `;
    return pool.query(query);
}

// =====================================================
// Master function to insert all test data in correct order
// =====================================================
async function insertAllTestData() {
    await insertTestDataBranch();
    console.log("✅ Branch data seeded");

    await insertTestDataDrivers();
    console.log("✅ Drivers data seeded");

    await insertTestDataReservations();
    console.log("✅ Reservations data seeded");

    await insertTestDataOrders();
    console.log("✅ Orders data seeded");

    await insertTestDataGpsTracking();
    console.log("✅ GPS tracking data seeded");

    await insertTestDataDeliveryHistory();
    console.log("✅ Delivery history data seeded");
}

// =====================================================
// Main function: reset + insert all
// =====================================================
async function fixTestDataTables() {
    try {
        await resetDataTables();                // First delete all data
        await insertAllTestData();              // Then insert fresh data
        console.log("🎉 All data tables successfully reset and seeded!");
        await pool.end();
    } catch (err) {
        console.error("❌ Failed to seed data tables: ", err);
        await pool.end();
    }
}

// Execute if run directly
fixTestDataTables();