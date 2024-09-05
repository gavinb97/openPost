require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { appendOrWriteToJsonFile, deleteFromPhotoData } = require('./utils');
const sharp = require('sharp');
const axios = require('axios');

const router = express.Router();
router.use(cookieParser());
router.use(cors());
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

// Multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = 'apiresources/uploads/temp/';
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Define your endpoints here

router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const fileName = req.file.filename;
    const username = req.body.username;
    const categories = req.body.categories ? JSON.parse(req.body.categories) : [];
    const description = req.body.description || '';

    const metadata = {
      name: fileName,
      description: description,
      categories: categories,
      NSFW: true
    };

    appendOrWriteToJsonFile(`${process.env.PHOTODATA_PATH}${username}/photoMetaData/photoData.txt`, metadata);

    const ext = path.extname(fileName).toLowerCase();
    let uploadDir;
    if (ext === '.jpg' || ext === '.jpeg' || ext === '.png' || ext === '.gif') {
      uploadDir = `apiresources/uploads/${username}/photos/`;
    } else if (ext === '.mp4' || ext === '.mov' || ext === '.avi' || ext === '.mkv') {
      uploadDir = `apiresources/uploads/${username}/videos/`;
    } else {
      throw new Error('Invalid file type');
    }

    fs.mkdirSync(uploadDir, { recursive: true });

    const sourcePath = `apiresources/uploads/temp/${fileName}`;
    const destinationPath = `${uploadDir}${fileName}`;
    fs.copyFileSync(sourcePath, destinationPath);
    fs.unlinkSync(sourcePath);

    const responseObj = {
      file: fileName,
      status: 'Success',
      description: description
    };
    res.status(200).send(responseObj);
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).send('Error uploading file.');
  }
});

router.post('/files', async (req, res) => {
  const username = req.body.username;
  const uploadsFolder = path.join(__dirname, 'apiresources', 'uploads', username, 'photos');
  try {
    const files = await fs.promises.readdir(uploadsFolder);
    const fileObjects = [];

    for (const file of files) {
      const filePath = path.join(uploadsFolder, file);
      const fileData = await fs.promises.readFile(filePath);
      const base64Data = fileData.toString('base64');

      const fileObject = {
        fileName: file,
        fileData: base64Data,
      };
      fileObjects.push(fileObject);
    }

    res.status(200).json(fileObjects);
  } catch (error) {
    console.error('Error reading files:', error);
    res.status(500).send('Error reading files.');
  }
});


router.post('/videos', async (req, res) => {
  const username = req.body.username;
  const uploadsFolder = path.join(__dirname, 'apiresources', 'uploads', username, 'videos');
  try {
    const files = await fs.promises.readdir(uploadsFolder);
    const fileObjects = [];

    for (const file of files) {
      const filePath = path.join(uploadsFolder, file);
      const fileData = await fs.promises.readFile(filePath);
      const base64Data = fileData.toString('base64');

      const fileObject = {
        fileName: file,
        fileData: base64Data,
      };
      fileObjects.push(fileObject);
    }

    res.status(200).json(fileObjects);
  } catch (error) {
    console.error('Error reading files:', error);
    res.status(500).send('Error reading files.');
  }
});

router.post('/deletebyname', async (req, res) => {
  const fileNames = req.body.fileNames;
  const username = req.body.username;
  const filesToDelete = Array.isArray(fileNames) ? fileNames : [fileNames];

  const photoExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
  const videoExtensions = ['.mp4', '.avi', '.mov', '.wmv'];

  const uploadsFolder = path.join(__dirname, 'apiresources', 'uploads', username);

  for (const fileName of filesToDelete) {
    const extension = path.extname(fileName).toLowerCase();
    let filePath;

    if (photoExtensions.includes(extension)) {
      filePath = path.join(uploadsFolder, 'photos', fileName);
    } else if (videoExtensions.includes(extension)) {
      filePath = path.join(uploadsFolder, 'videos', fileName);
    } else {
      console.error(`Unsupported file type for "${fileName}"`);
      continue;
    }

    try {
      await fs.promises.stat(filePath);
      await new Promise((resolve, reject) => {
        fs.unlink(filePath, (err) => {
          if (err) {
            console.error(`Error deleting file "${fileName}":`, err);
            reject(err);
          } else {
            console.log(`File "${fileName}" deleted successfully.`);
            resolve();
          }
        });
      });
    } catch (err) {
      console.error(`Error deleting file "${fileName}":`, err);
    }
  }

  deleteFromPhotoData(username, filesToDelete);

  res.status(200).send('Files deletion request received.');
});

router.get('/filesWithContent', async (req, res) => {
  const uploadsFolder = path.join(__dirname, 'apiresources', 'uploads');
  try {
    const files = await fs.promises.readdir(uploadsFolder);
    const filesWithContent = await Promise.all(files.map(async (file) => {
      const filePath = path.join(uploadsFolder, file);
      const fileContent = await fs.promises.readFile(filePath, 'utf8');
      return { fileName: file, content: fileContent };
    }));

    res.status(200).json({ filesWithContent });
  } catch (error) {
    console.error('Error reading files with content:', error);
    res.status(500).send('Error reading files with content.');
  }
});

router.post('/getphotometadata', async (req, res) => {
  const fileNames = req.body.fileNames;
  const photoData = await readPhotoDataFromFile(req.body.username);
  const metadata = photoData.filter(obj => fileNames.includes(obj.name));

  res.json(metadata);
});

router.post('/updatephotometadata', async (req, res) => {
  try {
    const newData = req.body.newData;
    const username = req.body.username;

    const existingData = await readPhotoDataFromFile(username);

    newData.forEach(newObj => {
      const index = existingData.findIndex(obj => obj.name === newObj.name);
      if (index !== -1) {
        existingData[index] = newObj;
      } else {
        existingData.push(newObj);
      }
    });

    await writePhotoDataToFile(existingData, username);

    res.status(200).json({ message: 'Photo metadata updated successfully.' });
  } catch (error) {
    console.error('Error updating photo metadata:', error);
    res.status(500).json({ error: 'An error occurred while updating photo metadata.' });
  }
});

const readPhotoDataFromFile = async (username) => {
  try {
    const data = await fs.promises.readFile(`${process.env.PHOTODATA_PATH}${username}/photoMetaData/photoData.txt`, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading photo data:', error);
    return [];
  }
};

const writePhotoDataToFile = async (data, username) => {
  try {
    await fs.promises.writeFile(`${process.env.PHOTODATA_PATH}${username}/photoMetaData/photoData.txt`, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing photo data:', error);
    throw error;
  }
};

router.post('/setSchedule', async (req, res) => {
  const scheduleData = req.body.scheduleData;

  try {
    const response = await axios.post('http://localhost:3455/jobs', scheduleData);
    res.status(response.status).send(response.data);
  } catch (error) {
    console.error('Error sending schedule data to jobs endpoint:', error);

    if (error.response) {
      res.status(error.response.status).send(error.response.data);
    } else {
      res.status(500).send('Internal Server Error');
    }
  }
});

module.exports = router;
