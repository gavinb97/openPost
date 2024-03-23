require("dotenv").config();
const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const cors = require('cors');
app.use(cookieParser());
app.use(cors());
const multer = require('multer');
const fs = require('fs').promises;



// Multer storage configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/'); // Destination folder for storing uploaded files
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + '-' + file.originalname); // Rename file with timestamp
    }
})



const upload = multer({ storage: storage })

// Endpoint for handling file uploads
app.post('/upload', upload.single('file'), async (req, res) => {
    try {
      // File uploaded successfully
      console.log('File uploaded:', req.file);
  
      // Extract filename
    const fileName = req.file.filename;
  
      // Respond with success status
      res.status(200).send(`File ${fileName} uploaded successfully.`);
    } catch (error) {
      // Error handling
      console.error('Error uploading file:', error);
      res.status(500).send('Error uploading file.');
    }
})







app.listen(3455, () => {
    console.log('running')
})