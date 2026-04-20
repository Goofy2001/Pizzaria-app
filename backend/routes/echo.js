//import de belangrijke packages
const express = require('express')
const echo = express.Router()

// opstellen van de JSON
// Debug endpoint: returns posted value to verify request body flow.
echo.post('/', function(req, res) {
    const newPost = {
        test: req.body.test,
        echo: req.body.test
    }
    res.status(201).json(newPost)
})


// exporteren van de routes
module.exports = echo