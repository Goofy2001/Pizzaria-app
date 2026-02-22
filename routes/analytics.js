// Heat maps
GET    /api/analytics/heatmap/:branch_id       // Data voor heat map

// Statistieken
GET    /api/analytics/stats/:branch_id         // Algemene stats
// → Retourneert: totaal bestellingen, gem. afstand, gem. duur, etc.

GET    /api/analytics/stats/driver/:driver_id  // Driver performance
// → Retourneert: aantal leveringen, gem. tijd, etc.

// Coverage area
GET    /api/analytics/coverage/:branch_id      // Verzorgingsgebied

// Postcode analyse
GET    /api/analytics/postcodes/:branch_id     // Bestellingen per postcode

// Tijdlijnen
GET    /api/analytics/timeline?start=2026-01-01&end=2026-02-01
// → Bestellingen over tijd

// Top data
GET    /api/analytics/top-streets/:branch_id   // Meest voorkomende straten
GET    /api/analytics/top-customers             // Meest trouwe klanten