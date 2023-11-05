const express = require('express');
const app = express();
const multer = require('multer');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.originalname + '-' + uniqueSuffix)
  }
})
const upload = multer({storage: storage}) // 미들웨어
const path = require('path');

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname + '/upload.html'));
})

app.post('/upload', upload.single('image'), (req, res) => {
  console.log(req.file);
  res.send('File uploaded successfully!');
})

app.listen(8080, function(){
    console.log('Server is running...');
});