const express = require("express");
const router = express.Router();
const path = require("path");

const User = require("../models/user");

router.get("/", async function (req, res) {
  res.sendFile(path.resolve(__dirname, "../login.html"));
});

router.get("/main", function (req, res) {
  res.send("Welcome!!");
});

module.exports = router;
