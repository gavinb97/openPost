const getMP3Duration = require('get-mp3-duration')
const { exec } = require('child_process');
const { getVideoDurationInSeconds } = require('get-video-duration')
const fs = require('fs');
const path = require('path');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path
const ffmpeg = require('fluent-ffmpeg')
const getMp3Duration = require('get-mp3-duration');
const concat = require('ffmpeg-concat');
const deleteFilesInDirectory = require('./utils')
ffmpeg.setFfmpegPath(ffmpegPath)


const editVideo = async () => {
    ffmpeg()
    .input("videos/2.MOV")
    .input("videos/ai2.mp4")
    .complexFilter([
    '[0:v]scale=300:300[0scaled]',
    '[1:v]scale=300:300[1scaled]',
    '[0scaled]pad=600:300[0padded]',
    '[0padded][1scaled]overlay=shortest=1:x=300[output]'
    ])
    .outputOptions([
    '-map [output]'
    ])
    .output("output.mp4")
    .on("error",function(er){
    console.log("error occured: "+er.message);
    })
    .on("end",function(){
    console.log("success");
    })
    .run();
    // ffmpeg('videos/ai1.mp4')
    //     .setStartTime('00:00:00')
    //     .setDuration(10)
    //     .output('newVideoDude.mp4')
    //     .on('end', function(err) {
    //         if(!err) { console.log('conversion Done') }
    //       })
    //       .on('error', err => console.log('error: ', err))
    //       .run()
}

const getAudioDuration = (relativePath) => {
    const audioPath = relativePath
    const rawAudio = fs.readFileSync(audioPath)
    const durationInMs = getMp3Duration(rawAudio)
    const durationInSeconds = Math.round(durationInMs / 1000)
    return durationInSeconds
}

const getVideoDuration = async (videoPath) => {
    const path = videoPath
    const duration = await getVideoDurationInSeconds(path)
    const durationInSeconds = Math.round(duration)
    // console.log(durationInSeconds)
    return durationInSeconds
}

const selectRandomVideo = () => {
    const videosFolder = path.join(__dirname, 'videos'); 

    // Read the contents of the folder
    const videoFiles = fs.readdirSync(videosFolder);

    // Check if there are any video files in the folder
    if (videoFiles.length === 0) {
        console.error('No video files found in the "videos" folder.');
        return null;
    }

    // Randomly select a video file
    const randomIndex = Math.floor(Math.random() * videoFiles.length);
    const randomVideo = videoFiles[randomIndex];

    // Return the full path of the randomly selected video
    const fullPath = path.join(videosFolder, randomVideo);
    const relativePath = path.relative(__dirname, fullPath).replace(/\\/g, '/');
    return relativePath
}

const getCombinedVideoPaths = async (relativePathAudio) => {
    const audioPath = relativePathAudio
    const arrayOfVideoPaths = []

    // get length of audio
    const audioDuration = getAudioDuration(audioPath)

    // get first video
    const firstVideoPath = selectRandomVideo()
    const durationOfFirstVideo = await getVideoDuration(firstVideoPath)
    arrayOfVideoPaths.push(firstVideoPath)
    let totalVideoDuration = durationOfFirstVideo
    
    // if first video is shorter than audio, grab path for another video
    while (audioDuration > totalVideoDuration) {
        const anotherVideoPath = selectRandomVideo()
        const durationOfVideo = await getVideoDuration(anotherVideoPath)
        totalVideoDuration = totalVideoDuration + durationOfVideo
        arrayOfVideoPaths.push(anotherVideoPath)
    }

    return arrayOfVideoPaths
}

const getMP3FileName = (relativePath) => {
    console.log(relativePath)
    // Extract the filename from the path
const fileNameWithExtension = relativePath.split('/').pop();
console.log(fileNameWithExtension)
// Remove the file extension
const fileNameWithoutExtension = fileNameWithExtension.replace(/\.[^/.]+$/, "");

return fileNameWithoutExtension;
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

const combineVideosForTempVideo = async (audioPath) => {
    const audioPathForVideo = audioPath
    const videoPaths = await getCombinedVideoPaths(audioPathForVideo)
    console.log(videoPaths)
    const audioName = getMP3FileName(audioPathForVideo)
    const outputPath = `tempVideos/${audioName}.mp4`
    console.log(outputPath)
    console.log('putting the temp video with audio here ^^')
    try {
        await concat({
            output: outputPath,
            videos: videoPaths,
            audio: audioPathForVideo,
            frameFormat: 'png'
        })
    } catch (error) {
        console.log('damn')
        console.log(error)
    }
    
    console.log('temp video complete')
    return outputPath
}


const cutVideoToFinalLength = async (relativePath, relativePathAudio) => {
    console.log('cutting video to final length...')
    const videoPath = relativePath
    const audioPath = relativePathAudio
    const finalVideoName = getMP3FileName(audioPath) + '.mp4'
    const audioDuration = getAudioDuration(audioPath)
    const finalDuration = audioDuration + 3
    const finalVideoPath = `finalVideos/${finalVideoName}`
    
        ffmpeg(videoPath)
        .setDuration(finalDuration)
        .output(finalVideoPath)
        .on('end', function(err) {
            if(!err) { console.log('conversion Done') }
          })
          .on('error', err => console.log('error: ', err))
          .run()

    // const ffmpegCommand = `ffmpeg -i ${videoPath} -t ${finalDuration} ${finalVideoPath}`;

    // // Execute the ffmpeg command
    // exec(ffmpegCommand, (error, stdout, stderr) => {
    // if (error) {
    //     console.error(`Error: ${error.message}`);
    //     return;
    // }
    // if (stderr) {
    //     console.error(`ffmpeg stderr: ${stderr}`);
    //     return;
    // }
    // console.log('ffmpeg stdout:', stdout);
    // console.log('Conversion complete!');
    // });

    console.log('final video complete')
    return finalVideoPath
}

// delete extra long videos, use max of 3 minutes
const isAudioTooLong = async () => {
    // return boolean
    
}

const addSubtitles = async (videoFilePath) => {
    const videoName = getMP3FileName(videoFilePath)
    const inputVideoFilePath = `finalVideos/${videoName}.mp4`
    console.log('input: ' + inputVideoFilePath)
    // const srtFileName = getMP3FileName(subtitleFilePath)
    const outputOptions = `-vf subtitles=./srtFiles/${videoName}.srt`
    console.log(outputOptions)
    const outputFileName = `videosWithSubtitles/${videoName}.mp4`
    console.log(outputFileName)
    ffmpeg(inputVideoFilePath)
        .outputOptions(
            outputOptions
        )
        .on('error', function(err) {
            console.log(err)
        })
        .save(outputFileName)
        .on('end', function() {
           console.log('done')
        })

    // const ffmpegCommand = `ffmpeg -i ${inputVideoFilePath} ${outputOptions} ${outputFileName}`;

    // // Execute the ffmpeg command
    // exec(ffmpegCommand, (error, stdout, stderr) => {
    // if (error) {
    //     console.error(`Error: ${error.message}`);
    //     return;
    // }
    // if (stderr) {
    //     console.error(`ffmpeg stderr: ${stderr}`);
    //     return;
    // }
    // console.log('ffmpeg stdout:', stdout);
    // console.log('Conversion complete!');
    // });
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

const sleep = async  (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}


const listenForString = (targetString) => {
    return new Promise((resolve, reject) => {
        const timeout = 120000; // Timeout in milliseconds
        let timer;
        
        // Event listener for 'data' event emitted by process.stdout
        process.stdout.on('data', (data) => {
            const consoleOutput = data.toString();
            if (consoleOutput.includes(targetString)) {
                clearInterval(timer); // Stop the timer if the target string is found
                resolve(true);
            }
        });

        // Timer to reject the promise if the target string is not found within the timeout period
        timer = setTimeout(() => {
            process.stdout.removeAllListeners('data'); // Remove the event listener
            reject(new Error(`Timeout: Target string '${targetString}' not found`));
        }, timeout);
    });
}

const deleteTempFiles = () => {
    deleteFilesInDirectory('srtFiles')
    deleteFilesInDirectory('audioSubtitles')
    deleteFilesInDirectory('finalVideos')
    deleteFilesInDirectory('tempAudio')
    deleteFilesInDirectory('tempVideos')
}


const createVideoForEachAudioFile = async () => {
    const audioFolder = path.join(__dirname, 'tempAudio'); 

    // Read the contents of the folder
    const audioFiles = fs.readdirSync(audioFolder);

    // Check if there are any video files in the folder
    if (audioFiles.length === 0) {
        console.error('No audio files found in the "tempAudio" folder.');
        return null;
    }

    for (audioFile of audioFiles) {
        // get path of each file
        const fullPath = path.join(audioFolder, audioFile);
        const relativePath = path.relative(__dirname, fullPath).replace(/\\/g, '/');
        console.log(relativePath)
        console.log('Creating video...')

        // create video for each file
        // relative path is audio path
        const videoOutputPath =  await combineVideosForTempVideo(relativePath)
        
        const finalVideoPath = await cutVideoToFinalLength(videoOutputPath, relativePath)
        let fileExists = false;
        do {
            console.log('Waiting for file to be finished...')
            fileExists = await seeIfFileExists(videoOutputPath)
            if (fileExists) {
                console.log('file exists!')
            }
        } while (!fileExists)

        console.log('sleeping whilst file is built...')
        await sleep(120000)
        console.log('okay its been a minute')
        await addSubtitles(finalVideoPath)
        console.log('subtitles have been added!!')
        await sleep(120000)
    }
    console.log('Deleting temporary files...')
    deleteTempFiles()
}


module.exports = createVideoForEachAudioFile

