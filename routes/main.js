const express = require('express');
const router = express.Router();
const path = require("path");

router.get("/", function (req, res) {
    res.sendFile(path.resolve(__dirname, '../login.html')); 
});

router.get("/main", function (req, res) {
    res.send("Welcome!!"); 
});

module.exports = router;