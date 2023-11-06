const express = require("express");
const multer = require("multer");
const path = require("path");
const spawn = require("child_process").spawn;
const fs = require("fs");

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

app.post("/upload", upload.single("image"), (req, res) => {
  fs.readFile(req.file.path, (err, data) => {
    if (err) throw err;
  
    const process = spawn("python3", ["image.py"]); // 실행시킬 파이썬 프로세스
  
    process.stdin.write(data);
    process.stdin.end();
  
    process.stdout.on("data", (data) => {
      console.log(`${data}`);
    });
  
    process.stderr.on("data", (data) => {
      console.log(`${data}`);
    });
  });
  res.send("File uploaded successfully!");
});

app.listen(8080, function () {
  console.log("Server is running...");
});
