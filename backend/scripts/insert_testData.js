const pool = require('../configs/database');

// =====================================================
// Reset all tables
// =====================================================
async function resetDataTables() {
    await pool.query(`
        TRUNCATE TABLE branch, drivers, reservations, orders, gps_tracking, delivery_history
        RESTART IDENTITY CASCADE
    `);
    console.log("✅ All tables reset");
}

// =====================================================
// 2 Branches
// =====================================================
function insertTestDataBranch() {
    return pool.query(`
        INSERT INTO branch (name, address, has_delivery, has_inHouse, has_pickUp, latitude, longitude)
        VALUES
            ('Downtown', 'Grote Markt 10, 1000 Brussel',  TRUE, TRUE, TRUE,  50.8465, 4.3517),
            ('Eastside', 'Mechelsesteenweg 200, 2018 Antwerpen', TRUE, TRUE, TRUE, 51.2030, 4.4170)
        ON CONFLICT (name) DO NOTHING
    `);
}

// =====================================================
// 4 Drivers (2 per branch)
// =====================================================
function insertTestDataDrivers() {
    return pool.query(`
        INSERT INTO drivers (name, branch_id, status, on_route, latitude, longitude, last_location_update)
        VALUES
            ('Jan Peeters',    1, 'ONLINE',  FALSE, 50.8460, 4.3520, NOW() - INTERVAL '10 minutes'),
            ('Marie Dubois',   1, 'ONLINE',  TRUE,  50.8510, 4.3460, NOW() - INTERVAL '2 minutes'),
            ('Wim Claes',      2, 'ONLINE',  FALSE, 51.2035, 4.4160, NOW() - INTERVAL '7 minutes'),
            ('Anja Van Den Berg', 2, 'ONLINE', TRUE, 51.2070, 4.4200, NOW() - INTERVAL '1 minute')
    `);
}

// =====================================================
// 4 Reservations (2 per branch)
// =====================================================
function insertTestDataReservations() {
    return pool.query(`
        INSERT INTO reservations
            (customer_name, customer_email, customer_telephonenumber, branch_id, date, hour, quantity, opmerking, status)
        VALUES
            ('Erik Van Dam',    'erik.vandam@mail.be',      '0478123456', 1, '2025-03-10', '18:30:00', 4, 'Tafel bij het raam', 'confirmed'),
            ('Sofie Peeters',   'sofie.p@hotmail.com',      '0487654321', 1, '2025-03-11', '19:00:00', 2, NULL,                 'pending'),
            ('Tom De Mayer',    'tom.demayer@skynet.be',    '0466558877', 2, '2025-03-12', '19:30:00', 3, 'Allergie voor noten','confirmed'),
            ('Nadia Bouazza',   'nadia.b@gmail.com',        '0477332211', 2, '2025-03-12', '20:30:00', 5, NULL,                 'cancelled')
    `);
}

// =====================================================
// 20 Orders — 10 per branch, one of each status
//
// Statuses (10): pending, paid, preparing, ready,
//   picked_up, on_table, loaded_for_delivery,
//   on_route, delivered, cancelled
// =====================================================
function insertTestDataOrders() {
    return pool.query(`
        INSERT INTO orders
            (customer_name, customer_email, customer_telephonenumber, branch_id, type,
             delivery_postalcode, delivery_municipality, delivery_streetname, delivery_housenumber,
             created, requested_hour, delivery_started, delivery_delivered, status, driver_id)
        VALUES
            -- ── Branch 1 (Downtown) ──────────────────────────────────────────
            ('Alice Peeters',  'alice@mail.be',   '0478000001', 1, 'delivery',
             '1000', 'Brussel', 'Nieuwstraat', '10',
             '2025-03-01 09:00:00', '12:00:00', NULL, NULL, 'pending', NULL),

            ('Bob Martens',    'bob@mail.be',     '0478000002', 1, 'delivery',
             '1000', 'Brussel', 'Koningsstraat', '22',
             '2025-03-01 09:30:00', '12:30:00', NULL, NULL, 'paid', NULL),

            ('Carol Claes',    'carol@mail.be',   '0478000003', 1, 'delivery',
             '1050', 'Brussel', 'Louizalaan', '80',
             '2025-03-01 10:00:00', '13:00:00', NULL, NULL, 'preparing', NULL),

            ('David Jacobs',   'david@mail.be',   '0478000004', 1, 'pickup',
             NULL, NULL, NULL, NULL,
             '2025-03-01 10:30:00', '13:30:00', NULL, NULL, 'ready', NULL),

            ('Emma Wouters',   'emma@mail.be',    '0478000005', 1, 'pickup',
             NULL, NULL, NULL, NULL,
             '2025-03-01 11:00:00', '14:00:00', NULL, NULL, 'picked_up', NULL),

            ('Frank Desmet',   'frank@mail.be',   '0478000006', 1, 'inHouse',
             NULL, NULL, NULL, NULL,
             '2025-03-01 11:30:00', '14:30:00', NULL, NULL, 'on_table', NULL),

            ('Grace Willems',  'grace@mail.be',   '0478000007', 1, 'delivery',
             '1080', 'Molenbeek', 'Ribeaucourtstraat', '15',
             '2025-03-01 12:00:00', '15:00:00', NULL, NULL, 'loaded_for_delivery', 1),

            ('Hans Dubois',    'hans@mail.be',    '0478000008', 1, 'delivery',
             '1190', 'Vorst', 'Brugmannlaan', '50',
             '2025-03-01 12:30:00', '15:30:00', '2025-03-01 15:10:00', NULL, 'on_route', 2),

            ('Ines Thys',      'ines@mail.be',    '0478000009', 1, 'delivery',
             '1210', 'Sint-Joost', 'Kruidtuinlaan', '30',
             '2025-03-01 08:00:00', '11:00:00', '2025-03-01 10:40:00', '2025-03-01 10:58:00', 'delivered', 1),

            ('Jonas Segers',   'jonas@mail.be',   '0478000010', 1, 'inHouse',
             NULL, NULL, NULL, NULL,
             '2025-03-01 13:00:00', '16:00:00', NULL, NULL, 'cancelled', NULL),

            -- ── Branch 2 (Eastside) ──────────────────────────────────────────
            ('Karen Aerts',    'karen@mail.be',   '0479000001', 2, 'delivery',
             '2018', 'Antwerpen', 'Mechelsesteenweg', '50',
             '2025-03-02 09:00:00', '12:00:00', NULL, NULL, 'pending', NULL),

            ('Ludo Vermeulen', 'ludo@mail.be',    '0479000002', 2, 'delivery',
             '2020', 'Antwerpen', 'Turnhoutsebaan', '100',
             '2025-03-02 09:30:00', '12:30:00', NULL, NULL, 'paid', NULL),

            ('Mia Van Dam',    'mia@mail.be',     '0479000003', 2, 'delivery',
             '2060', 'Antwerpen', 'Lange Leemstraat', '20',
             '2025-03-02 10:00:00', '13:00:00', NULL, NULL, 'preparing', NULL),

            ('Nick Nijs',      'nick@mail.be',    '0479000004', 2, 'pickup',
             NULL, NULL, NULL, NULL,
             '2025-03-02 10:30:00', '13:30:00', NULL, NULL, 'ready', NULL),

            ('Olivia Pauwels', 'olivia@mail.be',  '0479000005', 2, 'pickup',
             NULL, NULL, NULL, NULL,
             '2025-03-02 11:00:00', '14:00:00', NULL, NULL, 'picked_up', NULL),

            ('Pieter Jans',    'pieter@mail.be',  '0479000006', 2, 'inHouse',
             NULL, NULL, NULL, NULL,
             '2025-03-02 11:30:00', '14:30:00', NULL, NULL, 'on_table', NULL),

            ('Quinn Maes',     'quinn@mail.be',   '0479000007', 2, 'delivery',
             '2100', 'Deurne', 'Mirabellaan', '8',
             '2025-03-02 12:00:00', '15:00:00', NULL, NULL, 'loaded_for_delivery', 3),

            ('Rosa Vranken',   'rosa@mail.be',    '0479000008', 2, 'delivery',
             '2140', 'Borgerhout', 'Stenenbrug', '3',
             '2025-03-02 12:30:00', '15:30:00', '2025-03-02 15:05:00', NULL, 'on_route', 4),

            ('Sam Claes',      'sam@mail.be',     '0479000009', 2, 'delivery',
             '2018', 'Antwerpen', 'Frankrijklei', '45',
             '2025-03-02 08:00:00', '11:00:00', '2025-03-02 10:35:00', '2025-03-02 10:52:00', 'delivered', 3),

            ('Tine Jacobs',    'tine@mail.be',    '0479000010', 2, 'inHouse',
             NULL, NULL, NULL, NULL,
             '2025-03-02 13:00:00', '16:00:00', NULL, NULL, 'cancelled', NULL)
    `);
}

// =====================================================
// Minimal GPS tracking (active on_route drivers)
// =====================================================
function insertTestDataGpsTracking() {
    return pool.query(`
        INSERT INTO gps_tracking (driver_id, latitude, longitude, timestamp)
        VALUES
            (2, 50.8490, 4.3480, '2025-03-01 15:12:00'),
            (2, 50.8505, 4.3465, '2025-03-01 15:15:00'),
            (2, 50.8520, 4.3450, '2025-03-01 15:18:00'),
            (4, 51.2050, 4.4210, '2025-03-02 15:07:00'),
            (4, 51.2065, 4.4225, '2025-03-02 15:10:00'),
            (4, 51.2080, 4.4240, '2025-03-02 15:13:00')
    `);
}

// =====================================================
// Minimal delivery history (completed deliveries)
// =====================================================
function insertTestDataDeliveryHistory() {
    return pool.query(`
        INSERT INTO delivery_history
            (branch_id, order_id, start_lat, start_lon, end_lat, end_lon, distance_km, time_minutes, started_on, delivered_on)
        VALUES
            (1, 9,  50.8465, 4.3517, 51.2100, 4.4250, 3.1, 18, '2025-03-01 10:40:00', '2025-03-01 10:58:00'),
            (2, 19, 51.2030, 4.4170, 51.2080, 4.4240, 1.4,  9, '2025-03-02 10:35:00', '2025-03-02 10:52:00')
    `);
}

// =====================================================
// Main: reset + seed
// =====================================================
// Run all seed steps in a fixed order.
async function fixTestDataTables() {
    try {
        await resetDataTables();

        await insertTestDataBranch();       console.log("✅ Branch data seeded");
        await insertTestDataDrivers();      console.log("✅ Drivers data seeded");
        await insertTestDataReservations(); console.log("✅ Reservations data seeded");
        await insertTestDataOrders();       console.log("✅ Orders data seeded");
        await insertTestDataGpsTracking();  console.log("✅ GPS tracking data seeded");
        await insertTestDataDeliveryHistory(); console.log("✅ Delivery history data seeded");

        console.log("🎉 All tables successfully reset and seeded!");
        await pool.end();
    } catch (err) {
        console.error("❌ Failed to seed data tables:", err);
        await pool.end();
    }
}

// Run script immediately when executed with Node.
fixTestDataTables();