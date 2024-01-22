const express = require('express');
const router = express.Router();

router.get("/", function (req, res) {
    res.send("HealthINU 메인화면"); 
});

module.exports = router;