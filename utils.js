const fs = require('fs');
const path = require('path');

const deleteFilesInDirectory = (directoryPath) => {
    // Read the directory
    fs.readdir(directoryPath, (err, files) => {
        if (err) {
            console.error('Error reading directory:', err);
            return;
        }

        // Iterate through each file in the directory
        files.forEach(file => {
            // Construct the full path of the file
            const filePath = path.join(directoryPath, file);

            // Check if it's a file
            fs.stat(filePath, (err, stats) => {
                if (err) {
                    console.error('Error getting file stats:', err);
                    return;
                }

                if (stats.isFile()) {
                    // Delete the file
                    fs.unlink(filePath, err => {
                        if (err) {
                            console.error('Error deleting file:', err);
                            return;
                        }
                        console.log('Deleted:', filePath);
                    });
                }
            });
        });
    });
}

const getRandomMp4PathInDirectory = directory => {
    const files = fs.readdirSync(directory);
    const mp4Files = files.filter(file => path.extname(file) === '.mp4');

    if (mp4Files.length > 0) {
        const randomIndex = Math.floor(Math.random() * mp4Files.length);
        return path.join(directory, mp4Files[randomIndex]);
    } else {
        return null; // No .mp4 files found in the directory
    }
};

const getFileName = (relativePath) => {
    // console.log(relativePath)
    // Extract the filename from the path
const fileNameWithExtension = relativePath.split('/').pop();

// Remove the file extension
const fileNameWithoutExtension = fileNameWithExtension.replace(/\.[^/.]+$/, "");

const fileName = fileNameWithoutExtension.split('\\').pop();

return fileName;
}

const deleteFile = filePath => {
    try {
        fs.unlinkSync(filePath);
        console.log(`File ${filePath} deleted successfully.`);
    } catch (err) {
        console.error(`Error deleting file ${filePath}:`, err);
    }
};

const isFolderNotEmpty = (filePath) => {
    try {
        const files = fs.readdirSync(filePath);
        return files.length > 0;
    } catch (error) {
        console.error("Error reading directory:", error);
        return false; // Assume directory is empty if an error occurs
    }
};


const countFilesInDirectory = directoryPath => {
    try {
        const files = fs.readdirSync(directoryPath);
        return files.length;
    } catch (error) {
        console.error("Error reading directory:", error);
        return -1; // Return -1 to indicate an error
    }
};

module.exports ={
    deleteFilesInDirectory, 
    getRandomMp4PathInDirectory,
    getFileName,
    deleteFile,
    isFolderNotEmpty,
    countFilesInDirectory
} 