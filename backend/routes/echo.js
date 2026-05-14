/**
 * ECHO ROUTE (Debug)
 * Doel: Test endpoint voor request body debugging
 * Endpoint: POST /api/echo
 */

const express = require('express') //inladen van express
const echo = express.Router() //endpoint available maken

// POST /api/echo - Retourneer ingezonden waarde terug
// Nuttig voor debugging request body flow
echo.post('/', function(req, res) {
    // Creëer response object met echo van ingezonden test waarde
    const newPost = {
        test: req.body.test, // Original value
        echo: req.body.test  // Echo value
    }
    // Return 201 Created + echo response
    res.status(201).json(newPost)
})

module.exports = echo //echo global maken