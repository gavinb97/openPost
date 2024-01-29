const fs = require('fs');
const { exec } = require('child_process');

const createSRTFile = (subtitlesString, audioFilePath, filePath) => {
     // Get the duration of the audio file using ffprobe
     getAudioDuration(audioFilePath, (durationInSeconds) => {
        

        const subtitles = parseSubtitles(subtitlesString);
        console.log(subtitles.length)
        const durationBetweenSubtitles = durationInSeconds / subtitles.length;
        console.log(durationBetweenSubtitles)
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
    // Regular expression to match sentence endings (., !, ?) followed by zero or more spaces
    const sentenceEndingsRegex = /([.!?])\s+(?=[A-Z])/g;

    // Replace sentence endings with sentence ending + newline character
    const stringWithNewLines = inputString.replace(sentenceEndingsRegex, '$1\n');

    // Ensure there's a newline at the end of the string
    return stringWithNewLines.trim() + '\n';
}

const parseSubtitles = (subtitlesString, durationBetweenSubtitles) => {
    const subtitleStringFormatted = addNewLineToSentences(subtitlesString)

    // Split the subtitles string into individual lines
    const lines = subtitleStringFormatted.trim().split('\n');
    // console.log(lines)
    // Filter out empty lines
    // const filteredLines = lines.filter(line => line.trim() !== '');

    // const subtitles = [];

    // Combine lines into subtitle entries
    // let currentSubtitle = '';
    // filteredLines.forEach((line, index) => {
    //     currentSubtitle += line.trim() + ' ';
    //     // If the next line is empty or it's the last line, consider the currentSubtitle as a complete subtitle
    //     if (filteredLines[index + 1]?.trim() === '' || index === filteredLines.length - 1) {
    //         subtitles.push(currentSubtitle.trim());
    //         currentSubtitle = '';
    //     }
    // });
    // console.log(subtitles)
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

const readTextFile = (filePath) => {
    try {
        return fs.readFileSync(filePath, 'utf8');
    } catch (err) {
        console.error('Error reading file:', err);
        return null;
    }
}

const textFileString = readTextFile('audioSubtitles\\Aboutayearagowhileattend.txt')
console.log(textFileString)
createSRTFile(textFileString, 'tempaudio\\Aboutayearagowhileattend.mp3', 'srtFiles\\subtitle.srt')