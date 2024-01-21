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
    console.log(durationInSeconds)
    return durationInSeconds
}

const getVideoDuration = async (videoPath) => {
    const path = videoPath
    const duration = await getVideoDurationInSeconds(path)
    const durationInSeconds = Math.round(duration)
    console.log(durationInSeconds)
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

const combineVideosForFinalVideo = async (audioPath) => {
    const audioPathForVideo = audioPath
    const videoPaths = await getCombinedVideoPaths(audioPathForVideo)
    console.log(videoPaths)
    const audioName = getMP3FileName(audioPathForVideo)
    const outputPath = `finalVideos/${audioName}.mp4`
    await concat({
        output: outputPath,
        videos: videoPaths,
        // audio: 'tempAudio/speech.mp3'
        audio: audioPathForVideo
    })
    console.log('done')
}

const cutVideoToFinalLength = async (relativePath, relativePathAudio) => {
    const videoPath = relativePath
    const audioPath = relativePathAudio
    const finalVideoName = getMP3FileName(audioPath)
    const audioDuration = getAudioDuration(audioPath)

        ffmpeg(videoPath)
        .setStartTime('00:00:00')
        .setDuration(10)
        .output('newVideoDude.mp4')
        .on('end', function(err) {
            if(!err) { console.log('conversion Done') }
          })
          .on('error', err => console.log('error: ', err))
          .run()
}



const createVideoForEachAudioFile = () => {
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

        // create video for each file
        combineVideosForFinalVideo(relativePath)
    }
}
createVideoForEachAudioFile()


// combineVideosForFinalVideo()