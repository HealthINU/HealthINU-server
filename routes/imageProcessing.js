const express = require('express');
const router = express.Router();
const multer = require("multer");
const path = require("path");
const request = require("request");

/*
router.get("/", function (req, res) {
    // path.resolve : 상대경로를 절대경로로 변환
    res.sendFile(path.resolve(__dirname, '../upload.html'));
});
*/

router.use("/images", express.static(path.join(__dirname, "Images")));

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads");
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + "-" + file.originalname);
    }
});
const upload = multer({ storage: storage }); // 미들웨어

router.post("/upload", upload.single("image"), (req, res) => {
    const imagePath = path.resolve(req.file.path); // 업로드 된 이미지 경로 
    request.post(
        {
            url: "http://127.0.0.1:8000/process",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: imagePath }) // JSON 형식으로 이미지 경로 전송
        },
        function (err, httpResponse, body) {
            if (err) {
                console.error("upload failed:", err);
                res.status(500).send("Error occurred while uploading file.");
            } else {
                const response = JSON.parse(body); // 응답을 JSON으로 파싱
                if (response && response.result) {
                    const top3_result = response.result; // 'result' 필드에 저장된 top3_result 
                    console.log("Upload successful! Server responded with:", top3_result);
                    res.send({ result: top3_result });
                } else {
                    console.error("Error in server response:", response);
                    res.status(500).send("Error in server response.");
                }
            }
        });
});

module.exports = router;