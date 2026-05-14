/**
 * ABOUT ROUTE (Info)
 * Doel: Project info endpoint met metadata
 * Endpoint: GET /api/about
 */

const express = require('express') //inladen express
const about = express.Router() //maak endpoint /about

// GET /api/about - GET method op /about
// Bevat metadata over developer en project
about.get('/', function(req, res) {
    // Return project info object met huidige timestamp
    res.send({
        id: "Thibo",
        project: "Pizzaria-ecosysteem",
        Leerdoel: "Full-stack developer",
        time: new Date()
    })
})

//maak about global
module.exports = about