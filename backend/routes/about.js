//import de belangrijke packages
const express = require('express')
const about = express.Router()

// opstellen van de JSON
// Health/info endpoint with basic project metadata.
about.get('/', function(req, res) {
    res.send({
        id: "Thibo",
        project: "Pizzaria-ecosysteem",
        Leerdoel: "Full-stack developer",
        time: new Date()
    })
})


// exporteren van de routes
module.exports = about