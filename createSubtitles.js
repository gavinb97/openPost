const fs = require('fs').promises;
const { exec } = require('child_process');

const createSRTFile = async (subtitlesString, audioFilePath, filePath) => {
     // Get the duration of the audio file using ffprobe
     getAudioDuration(audioFilePath, (durationInSeconds) => {
        

        const subtitles = parseSubtitles(subtitlesString);
        console.log(subtitles.length)
        let durationBetweenSubtitles = durationInSeconds / subtitles.length;

        console.log(durationBetweenSubtitles)

        durationBetweenSubtitles = durationBetweenSubtitles
        let srtContent = '';

        // Iterate over each subtitle entry
        subtitles.forEach((subtitle, index) => {
            const entryNumber = index + 1;
            const startTime = formatTime(index * durationBetweenSubtitles);
            const endTime = formatTime((index + 1) * durationBetweenSubtitles);

            // Format the subtitle entry
            srtContent += `${entryNumber}\n${startTime} --> ${endTime}\n${subtitle}\n\n`;
        });

        // Write the content to the .srt file
        fs.writeFile(filePath, srtContent, (err) => {
            if (err) {
                console.error('Error writing .srt file:', err);
            } else {
                console.log('Subtitle file created successfully:', filePath);
            }
        });
    });
}

const addNewLineToSentences = (inputString) => { 
     // Regular expression to match every 6 words
     const fourWordsRegex = /(?:\S+\s+){6}/g;
 
     // Replace every 6 words with 6 words + newline character
     let stringWithNewLines = inputString.replace(fourWordsRegex, '$&\n');
 
     // Ensure there's a newline at the end of the string
     return stringWithNewLines.trim() + '\n';
}

const parseSubtitles = (subtitlesString) => {
    const subtitleStringFormatted = addNewLineToSentences(subtitlesString)

    // Split the subtitles string into individual lines
    const lines = subtitleStringFormatted.trim().split('\n');
 
    return lines;
}

const formatTime = (timeInSeconds) => {
    const date = new Date(timeInSeconds * 1000);
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    const seconds = date.getUTCSeconds().toString().padStart(2, '0');
    const milliseconds = date.getUTCMilliseconds().toString().padStart(3, '0');
    return `${hours}:${minutes}:${seconds},${milliseconds}`;
}

const countSubtitles = (subtitlesString) => {
    return subtitlesString.trim().split('\n').filter(line => line.trim() !== '').length;
}

// Helper function to get the duration of the audio file using ffprobe
const getAudioDuration = (audioFilePath, callback) => {
    const command = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioFilePath}"`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error getting audio duration: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`ffprobe error: ${stderr}`);
            return;
        }
        const durationInSeconds = parseFloat(stdout);
        callback(durationInSeconds);
    });
}

const readTextFile = async (filePath) => {
    try {
        return fs.readFile(filePath, 'utf-8');
    } catch (err) {
        console.error('Error reading file:', err);
        return null;
    }
}

module.exports = {
    readTextFile,
    createSRTFile
}

// const textFileString = readTextFile('audioSubtitles\\Aboutayearagowhileattend.txt')
// console.log(textFileString)
// createSRTFile(textFileString, 'tempaudio\\Aboutayearagowhileattend.mp3', 'srtFiles\\subtitle.srt')