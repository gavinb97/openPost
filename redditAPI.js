require("dotenv").config();
const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const cors = require('cors');
app.use(cookieParser());
app.use(cors());
const multer = require('multer');
const fs = require('fs').promises;
const path = require('path');


// Multer storage configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      // Check file type
      if (file.mimetype.startsWith('image')) {
        cb(null, 'uploads/photos/');
      } else if (file.mimetype.startsWith('video')) {
        cb(null, 'uploads/videos/');
      } else {
        // Invalid file type, handle accordingly
        cb(new Error('Invalid file type'));
      }
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + '-' + file.originalname);
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

    let categories;
    if (req.body.categories) {
       categories = req.body.categories; 
    }
    
      // Respond with success status
      const responseObj = {
        file: fileName,
        status: 'Success',
        categories: categories || []
      }
      res.status(200).send(responseObj);
    } catch (error) {
      // Error handling
      console.error('Error uploading file:', error);
      res.status(500).send('Error uploading file.');
    }
})


// Endpoint to get the names of all files within the uploads folder
app.get('/files', async (req, res) => {
    const uploadsFolder = path.join(__dirname, 'uploads', 'photos');
    try {
        // Read the contents of the uploads folder
        const files = await fs.readdir(uploadsFolder);
        
        // Array to store file objects with name and data
        const fileObjects = [];

        // Iterate through each file in the folder
        for (const file of files) {
            const filePath = path.join(uploadsFolder, file);
            // Read file data asynchronously
            const fileData = await fs.readFile(filePath);
            // Convert file data to base64-encoded string
            const base64Data = fileData.toString('base64');
            // Create file object with name and data
            const fileObject = {
                fileName: file,
                fileData: base64Data
            };
            // Push file object to the array
            fileObjects.push(fileObject);
        }

        // Send the array of file objects as the response
        res.status(200).json(fileObjects);
    } catch (error) {
        // Error handling
        console.error('Error reading files:', error);
        res.status(500).send('Error reading files.');
    }
});



  // Endpoint to return all file names along with their actual files
  app.get('/filesWithContent', async (req, res) => {
    const uploadsFolder = path.join(__dirname, 'uploads');
    try {
      // Read the contents of the uploads folder
      const files = await fs.readdir(uploadsFolder);
  
      // Read the content of each file
      const filesWithContent = await Promise.all(files.map(async (file) => {
        const filePath = path.join(uploadsFolder, file);
        const fileContent = await fs.readFile(filePath, 'utf8');
        return { fileName: file, content: fileContent };
      }));
  
      // Send the list of file names along with their content as the response
      res.status(200).json({ filesWithContent });
    } catch (error) {
      // Error handling
      console.error('Error reading files with content:', error);
      res.status(500).send('Error reading files with content.');
    }
  })

// Endpoint to get the names of all files within the uploads folder
app.get('/setSchedule', async (req, res) => {
    
    try {
        if (req.schedule) {
          const schedule = req.schedule  
        }
      
      res.status(200).send('ooh weee')
    } catch (error) {
      // Error handling
      console.error(error);
      res.status(500).send('uuuuuuuuuuuuuuuuuuuuuuuuuf');
    }
  })


app.listen(3455, () => {
    console.log('running')
})