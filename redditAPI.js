require("dotenv").config();
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const cookieParser = require('cookie-parser');
const cors = require('cors');
app.use(cookieParser());
app.use(cors());
app.use(bodyParser.json());
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const {appendOrWriteToJsonFile, deleteFromPhotoData} = require('./utils')

// Multer storage configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      // Check file type
      if (file.mimetype.startsWith('image')) {
        cb(null, 'apiresources/uploads/photos/');
      } else if (file.mimetype.startsWith('video')) {
        cb(null, 'apiresources/uploads/videos/');
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
        console.log(req.body.categories)

        let description = '';
        if (req.body.description) {
            description = req.body.description;
        }

        let categories = []
        if (req.body.categories) {
            categories = JSON.parse(req.body.categories)
        }

        // Construct the metadata object
        const metadata = {
            name: fileName,
            description: description,
            categories: categories
        };

        // Append metadata to the JSON file
        appendOrWriteToJsonFile('apiresources/uploads/photoMetadata/photoData.txt', metadata);

        // Respond with success status
        const responseObj = {
            file: fileName,
            status: 'Success',
            description: description
        };
        res.status(200).send(responseObj);
    } catch (error) {
        // Error handling
        console.error('Error uploading file:', error);
        res.status(500).send('Error uploading file.');
    }
});


// Endpoint to get the names of all files within the uploads folder
app.get('/files', async (req, res) => {
    const uploadsFolder = path.join(__dirname, 'apiresources', 'uploads', 'photos');
    try {
        // Read the contents of the uploads folder
        const files = await fs.promises.readdir(uploadsFolder);
        
        // Array to store file objects with name and data
        const fileObjects = [];

        // Iterate through each file in the folder
        for (const file of files) {
            const filePath = path.join(uploadsFolder, file);
            // Read file data asynchronously
            const fileData = await fs.promises.readFile(filePath);
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

app.post('/deletebyname', async (req, res) => {
    const fileNames = req.body; // Assuming body contains either a single string or an array of strings
    console.log(fileNames);
    // Ensure fileNames is an array
    const filesToDelete = Array.isArray(fileNames) ? fileNames : [fileNames];
    console.log(filesToDelete);
    const uploadsFolder = path.join(__dirname, 'apiresources', 'uploads', 'photos');
    // Loop through each filename and delete if found in uploads/photos folder
    for (const fileName of filesToDelete) {
        console.log('in loop');
        console.log(fileName);
        const filePath = path.join(uploadsFolder, fileName);
        console.log(filePath);
        try {
            // Check if file exists
            await fs.promises.stat(filePath);
            // File exists, delete it
            await fs.promises.unlink(filePath);
            console.log(`File "${fileName}" deleted successfully.`);
        } catch (err) {
            // File does not exist or error occurred during deletion
            console.error(`Error deleting file "${fileName}":`, err);
        }

        deleteFromPhotoData(filesToDelete)
    }

    res.status(200).send('Files deletion request received.');
});



  // Endpoint to return all file names along with their actual files
  app.get('/filesWithContent', async (req, res) => {
    const uploadsFolder = path.join(__dirname, 'apiresources', 'uploads');
    try {
      // Read the contents of the uploads folder
      const files = await fs.promises.readdir(uploadsFolder);
  
      // Read the content of each file
      const filesWithContent = await Promise.all(files.map(async (file) => {
        const filePath = path.join(uploadsFolder, file);
        const fileContent = await fs.promises.readFile(filePath, 'utf8');
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

  app.post('/getphotometadata', async (req, res) => {
    console.log('getting metadata')
    console.log(req.body)
    const fileNames = req.body; // Array of file names
    const photoData = await readPhotoDataFromFile(); // Read photo data from file

    // Filter photoData to include only objects with names in the request body
    const metadata = photoData.filter(obj => fileNames.includes(obj.name));

    res.json(metadata);
});

// POST endpoint to update photo metadata
app.post('/updatephotometadata', async (req, res) => {
    try {
        const newData = req.body; // Array of new photo data objects
        const existingData = await readPhotoDataFromFile(); // Read existing photo data from file

        // Update existing data with new data
        newData.forEach(newObj => {
            const index = existingData.findIndex(obj => obj.name === newObj.name);
            if (index !== -1) {
                existingData[index] = newObj;
            } else {
                existingData.push(newObj); // Add new object if it doesn't exist
            }
        });

        // Write updated data to file
        await writePhotoDataToFile(existingData);

        res.status(200).json({ message: 'Photo metadata updated successfully.' });
    } catch (error) {
        console.error('Error updating photo metadata:', error);
        res.status(500).json({ error: 'An error occurred while updating photo metadata.' });
    }
});

// Function to read photo data from file
const readPhotoDataFromFile = async () => {
    try {
        const data = await fs.promises.readFile('apiresources/uploads/photoMetadata/photoData.txt', 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading photo data:', error);
        return [];
    }
};

// Function to write photo data to file
const writePhotoDataToFile = async (data) => {
    try {
        await fs.promises.writeFile('apiresources/uploads/photoMetadata/photoData.txt', JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error('Error writing photo data:', error);
        throw error;
    }
};


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


app.listen(3456, () => {
    console.log('running')
})