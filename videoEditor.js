const getMP3Duration = require('get-mp3-duration')
const { getVideoDurationInSeconds } = require('get-video-duration')
const fs = require('fs');
const path = require('path');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path
const ffmpeg = require('fluent-ffmpeg')
const getMp3Duration = require('get-mp3-duration');
const concat = require('ffmpeg-concat');
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
    // Extract the filename from the path
const fileNameWithExtension = relativePath.split('/').pop();

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
    
    console.log('done')
    return outputPath
}


const cutVideoToFinalLength = async (relativePath, relativePathAudio) => {
    console.log('cutting video to final length')
    const videoPath = relativePath
    const audioPath = relativePathAudio
    const finalVideoName = getMP3FileName(audioPath) + '.mp4'
    const audioDuration = getAudioDuration(audioPath)
    const finalDuration = audioDuration + 3
    const finalVideoPath = `finalVideos/${finalVideoName}`
    console.log('final video path ')
    console.log(finalVideoPath)
        ffmpeg(videoPath)
        .setDuration(finalDuration)
        .output(finalVideoPath)
        .on('end', function(err) {
            if(!err) { console.log('conversion Done') }
          })
          .on('error', err => console.log('error: ', err))
          .run()
}

// delete extra long videos, use max of 3 minutes
const isAudioTooLong = async () => {
    // return boolean
    
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
        console.log('Creating video')
        // create video for each file
        // relative path is audio path
        const videoOutputPath =  await combineVideosForTempVideo(relativePath)
        console.log('000000000')
        console.log(videoOutputPath)
        cutVideoToFinalLength(videoOutputPath, relativePath)
    }
}
createVideoForEachAudioFile()


