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


module.exports = deleteFilesInDirectory