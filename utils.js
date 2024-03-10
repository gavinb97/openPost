const fs = require('fs');
const path = require('path');

const deleteFilesInDirectory = async (directoryPath) => {
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
    // Extract the filename from the path
const fileNameWithExtension = relativePath.split('/').pop();

// Remove the file extension
const fileNameWithoutExtension = fileNameWithExtension.replace(/\.[^/.]+$/, "");

const fileName = fileNameWithoutExtension.split('\\').pop();

return fileName;
}

const deleteFile = async (filePath) => {
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

const removeQuotes = (str) => {
    return str.replace(/[""]/g, '');
}

const removeSpecialCharacters = (str) => {
    // Define the pattern to match special characters
    const pattern = /[^\w\s]/gi; // Matches any character that is not a word character or whitespace
  
    // Replace special characters with an empty string
    return str.replace(pattern, '');
  }

const removeSpaces = (str) => {
    return str.replace(/\s/g, '');
}

const seeIfFileExists = async (filePath) => {
    try {
        // Check if the file exists
        fs.accessSync(filePath, fs.constants.F_OK);
        return true;
    } catch (err) {
        // File does not exist or cannot be accessed
        return false;
    }
}

const deleteTempFiles = async () => {
    await deleteFilesInDirectory('srtFiles')
    // await deleteFilesInDirectory('audioSubtitles')
    await deleteFilesInDirectory('finalVideos')
    await deleteFilesInDirectory('tempAudio')
    await deleteFilesInDirectory('tempVideos')
    await deleteFilesInDirectory('mixedAudio')
}


const getMP3FileName = (relativePath) => {
    console.log(relativePath);

    // Replace backslashes with forward slashes
    const normalizedPath = relativePath.replace(/\\/g, '/');

    // Extract the filename from the path
    const fileNameWithExtension = normalizedPath.split('/').pop();
    console.log(fileNameWithExtension);

    // Remove the file extension
    const fileNameWithoutExtension = fileNameWithExtension.replace(/\.[^/.]+$/, "");

    return fileNameWithoutExtension;
}

const writeTextToFile = async (text, fileName) => {
    fs.writeFile(fileName, text, (err) => {
        if (err) {
            console.error('Error writing to file:', err);
        } else {
            console.log('Data has been written to', fileName);
        }
    });
}

const readTokensFromFile = (filePath) => {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        const tokens = {};
        const regex = /accessToken:\s*(.*?)\s*refreshToken:\s*(.*)/;
        const matches = data.match(regex);
        
        if (matches && matches.length >= 3) {
            tokens.access_token = matches[1];
            tokens.refresh_token = matches[2];
        } else {
            throw new Error('Access token and/or refresh token not found in the file.');
        }
        
        return tokens;
    } catch (err) {
        console.error('Error reading tokens file:', err);
        return null;
    }
}

const getVideoChunkInfo = (filePath) => {
    try {
        const stats = fs.statSync(filePath);
        const fileSize = stats.size;
        const chunkSize = 10000000; // You can adjust this as per your requirements
        const totalChunkCount = Math.ceil(fileSize / chunkSize);

        return {
            file_size: fileSize,
            total_chunk_count: totalChunkCount,
            chunk_size: chunkSize
        };
    } catch (err) {
        console.error('Error getting video info for TikTok:', err);
        return null; // Return null if an error occurs
    }
}

const getFileSizeInBytes = (filePath) => {
    try {
        const stats = fs.statSync(filePath);
        return stats.size; // returns the size of the file in bytes
    } catch (err) {
        console.error('Error getting file size:', err);
        return null; // return null if an error occurs
    }
}

const sleep = async  (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports ={
    deleteFilesInDirectory, 
    getRandomMp4PathInDirectory,
    getFileName,
    deleteFile,
    isFolderNotEmpty,
    countFilesInDirectory,
    removeQuotes,
    removeSpecialCharacters,
    removeSpaces,
    seeIfFileExists,
    deleteTempFiles,
    getMP3FileName,
    writeTextToFile,
    readTokensFromFile,
    getVideoChunkInfo,
    getFileSizeInBytes,
    sleep
} 