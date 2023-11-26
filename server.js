const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const axios = require('axios').default;
const request = require('request');

const app = express();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});
const upload = multer({ storage: storage }); // 미들웨어

app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname + "/upload.html"));
});

app.post("/upload", upload.single("image"), async (req, res) => {
  const imagePath = path.resolve(req.file.path); // 이미지 경로 
  request.post({
    url: 'http://localhost:8000/process',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 'image': imagePath }) // JSON 형식으로 이미지 경로 전송
  }, function(err, httpResponse, body) {
    if (err) {
      console.error('upload failed:', err);
      res.status(500).send("Error occurred while uploading file.");
    } else {
      const response = JSON.parse(body); // 응답을 JSON으로 파싱
      console.log(response);
      if (response && response.result) {
        const top3_result = response.result; // 'result' 필드에 저장된 top3_result 
        console.log('Upload successful! Server responded with:', top3_result);
        res.send("File uploaded successfully!");
      } else {
        console.error('Error in server response:', response);
        res.status(500).send("Error in server response.");
      }
    }
  });
});



app.listen(8080, function () {
  console.log("Server is running...");
});